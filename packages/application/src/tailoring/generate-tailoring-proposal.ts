import {
  checkFabrication,
  createSuggestionId,
  createTailoredCvId,
  DomainError,
  jobPostingIdSchema,
  matchProfileToJob,
  parseSuggestion,
  parseTailoredCv,
  profileForModel,
  tailoredCvStatusFor,
  type ConfirmedProfile,
  type JobPosting,
  type Profile,
  type Suggestion,
  type SuggestionTarget,
  type TailoredCv,
} from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";
import type { TailoredCvRepository } from "../ports/tailored-cv-repository.ts";
import type { ProposedSuggestion, TailoringProposer } from "../ports/tailoring-proposer.ts";

const PROFILE_NOT_FOUND = "Todavía no hay un perfil confirmado.";
const JOB_NOT_FOUND = "No hay una oferta con ese identificador.";

export interface GenerateTailoringProposalDeps {
  profiles: ProfileRepository;
  jobPostings: JobPostingRepository;
  tailoredCvs: TailoredCvRepository;
  proposer: TailoringProposer;
}

export async function generateTailoringProposal(
  deps: GenerateTailoringProposalDeps,
  jobPostingId: string,
): Promise<TailoredCv> {
  const profile = await deps.profiles.findLatest();
  if (profile === null) {
    throw new ApplicationError("profile_not_found", PROFILE_NOT_FOUND);
  }
  const id = jobPostingIdSchema.safeParse(jobPostingId);
  if (!id.success) {
    throw new ApplicationError("job_not_found", JOB_NOT_FOUND);
  }
  const job = await deps.jobPostings.findById(id.data);
  if (job === null) {
    throw new ApplicationError("job_not_found", JOB_NOT_FOUND);
  }

  const existing = await deps.tailoredCvs.findByProfileAndJob(profile.id, job.id);
  if (existing !== null && sameSnapshot(existing.snapshot, profile)) {
    return existing;
  }

  const report = matchOrReject(profile, job);
  const proposed = await deps.proposer.propose({
    profile: profileForModel(profile),
    job,
    match: report,
  });
  const suggestions = materialize(profile, job, proposed);
  try {
    const cv = parseTailoredCv({
      id: existing?.id ?? createTailoredCvId(),
      profileId: profile.id,
      jobPostingId: job.id,
      status: tailoredCvStatusFor(suggestions),
      snapshot: profile,
      suggestions,
      matchResults: report.matchResults,
      exports: existing?.exports ?? [],
    });
    await deps.tailoredCvs.save(cv);
    return cv;
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", error.message, error);
    }
    throw error;
  }
}

export async function loadTailoringProposal(
  deps: Pick<GenerateTailoringProposalDeps, "profiles" | "tailoredCvs">,
  jobPostingId: string,
): Promise<TailoredCv | null> {
  const profile = await deps.profiles.findLatest();
  if (profile === null) {
    throw new ApplicationError("profile_not_found", PROFILE_NOT_FOUND);
  }
  const id = jobPostingIdSchema.safeParse(jobPostingId);
  if (!id.success) {
    return null;
  }
  return deps.tailoredCvs.findByProfileAndJob(profile.id, id.data);
}

function matchOrReject(profile: ConfirmedProfile, job: JobPosting) {
  try {
    return matchProfileToJob(profile, job);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_job", error.message, error);
    }
    throw error;
  }
}

function materialize(profile: ConfirmedProfile, job: JobPosting, proposed: readonly ProposedSuggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];
  for (const item of proposed) {
    const key = targetKey(item.target);
    if (seen.has(key)) {
      continue;
    }
    const before = beforeText(profile, item.target);
    const after = item.after.trim();
    const reason = item.reason.trim();
    if (before === null || after.length === 0 || reason.length === 0) {
      continue;
    }
    if (normalizeSpace(before) === normalizeSpace(after)) {
      continue;
    }
    const validation = checkFabrication(profile, job, { target: item.target, after, evidence: item.evidence });
    if (validation.outcome !== "valid") {
      continue;
    }
    try {
      suggestions.push(
        parseSuggestion({
          id: createSuggestionId(),
          target: item.target,
          before,
          after,
          reason,
          evidence: item.evidence,
          status: "pending",
          validation,
        }),
      );
      seen.add(key);
    } catch (error) {
      if (!(error instanceof DomainError)) {
        throw error;
      }
    }
  }
  return suggestions;
}

function beforeText(profile: ConfirmedProfile, target: SuggestionTarget): string | null {
  if (target.type === "summary") {
    return profile.summary ?? "";
  }
  if (target.type === "skill_order") {
    return profile.skills.map((skill) => skill.name).join("\n");
  }
  for (const experience of profile.experiences) {
    const bullet = experience.bullets.find((item) => item.id === target.bulletId);
    if (bullet !== undefined) {
      return bullet.text;
    }
  }
  for (const project of profile.projects) {
    const bullet = project.bullets.find((item) => item.id === target.bulletId);
    if (bullet !== undefined) {
      return bullet.text;
    }
  }
  return null;
}

function targetKey(target: SuggestionTarget): string {
  if (target.type === "bullet") {
    return `bullet:${target.bulletId}`;
  }
  return target.type;
}

function sameSnapshot(snapshot: Profile, profile: Profile): boolean {
  return JSON.stringify(snapshot) === JSON.stringify(profile);
}

function normalizeSpace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
