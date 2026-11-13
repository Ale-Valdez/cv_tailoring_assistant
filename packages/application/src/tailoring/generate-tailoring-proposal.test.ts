import {
  confirmProfile,
  evidenceRefSchema,
  parseCvExport,
  parseJobPosting,
  parseProfile,
  suggestionTargetSchema,
  type ConfirmedProfile,
  type JobPosting,
  type JobPostingId,
  type ProfileId,
  type TailoredCv,
  type TailoredCvId,
} from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";
import type { TailoredCvRepository } from "../ports/tailored-cv-repository.ts";
import type { ProposedSuggestion, TailoringProposalInput, TailoringProposer } from "../ports/tailoring-proposer.ts";
import { generateTailoringProposal } from "./generate-tailoring-proposal.ts";
import { reviewSuggestion } from "./review-suggestion.ts";

const profileId = "11111111-1111-4111-8111-111111111111";
const bulletId = "33333333-3333-4333-8333-333333333333";
const jobId = "12121212-1212-4121-8121-121212121212";

function confirmedProfile(): ConfirmedProfile {
  return confirmProfile(
    parseProfile({
      id: profileId,
      status: "needs_review",
      contact: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: null,
        location: null,
        links: [],
      },
      summary: "Desarrolla servicios con TypeScript.",
      language: "es",
      experiences: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [{ id: bulletId, text: "Mantuve APIs en TypeScript." }],
        },
      ],
      education: [],
      skills: [{ id: "44444444-4444-4444-8444-444444444444", name: "TypeScript", source: "extracted_from_cv" }],
      projects: [],
    }),
  );
}

function posting(): JobPosting {
  return parseJobPosting({
    id: jobId,
    rawText: "Buscamos TypeScript.",
    title: "Backend",
    company: null,
    language: "es",
    contentHash: "abc",
    requirements: [
      {
        id: "13131313-1313-4131-8131-131313131313",
        text: "Experiencia con TypeScript",
        kind: "technical",
        priority: "required",
      },
    ],
    keywords: [
      {
        id: "19191919-1919-4191-8191-191919191919",
        canonical: "TypeScript",
        aliases: [],
        frequency: 1,
        origin: "requisitos",
      },
    ],
  });
}

function proposed(value: {
  target: unknown;
  after: string;
  reason: string;
  evidence: unknown;
}): ProposedSuggestion {
  return {
    target: suggestionTargetSchema.parse(value.target),
    after: value.after,
    reason: value.reason,
    evidence: Array.isArray(value.evidence) ? value.evidence.map((item) => evidenceRefSchema.parse(item)) : [],
  };
}

function proposals(): ProposedSuggestion[] {
  return [
    proposed({
      target: { type: "bullet", bulletId },
      after: "Mantuve las APIs del servicio en TypeScript.",
      reason: "Nombra el servicio sin agregar herramientas.",
      evidence: [{ type: "bullet", bulletId }],
    }),
    proposed({
      target: { type: "bullet", bulletId },
      after: "Otra versión que no debe ganar.",
      reason: "Duplicada.",
      evidence: [{ type: "bullet", bulletId }],
    }),
    proposed({
      target: { type: "summary" },
      after: "Desarrolla servicios con TypeScript y Kubernetes.",
      reason: "Agrega una herramienta que el perfil no tiene.",
      evidence: [{ type: "summary" }],
    }),
    proposed({
      target: { type: "summary" },
      after: "Desarrolla servicios con TypeScript.",
      reason: "No cambia el resumen.",
      evidence: [{ type: "summary" }],
    }),
  ];
}

function proposerReturning(items: ProposedSuggestion[]): TailoringProposer & { calls: TailoringProposalInput[] } {
  const calls: TailoringProposalInput[] = [];
  return {
    calls,
    async propose(input) {
      calls.push(input);
      return items;
    },
  };
}

function memoryProfiles(initial: ConfirmedProfile | null = confirmedProfile()): ProfileRepository & {
  current: ConfirmedProfile | null;
} {
  const state = { current: initial };
  return {
    get current() {
      return state.current;
    },
    set current(value: ConfirmedProfile | null) {
      state.current = value;
    },
    async save(profile) {
      state.current = profile;
    },
    async findLatest() {
      return state.current;
    },
  };
}

function memoryJobs(initial: JobPosting | null = posting()): JobPostingRepository {
  const rows = initial === null ? [] : [initial];
  return {
    async save(next) {
      const index = rows.findIndex((row) => row.id === next.id);
      if (index === -1) {
        rows.push(next);
        return;
      }
      rows[index] = next;
    },
    async findById(id: JobPostingId) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByContentHash(contentHash: string) {
      return rows.find((row) => row.contentHash === contentHash) ?? null;
    },
    async findLatest() {
      return rows.at(-1) ?? null;
    },
  };
}

function memoryCvs(): TailoredCvRepository & { rows: TailoredCv[] } {
  const rows: TailoredCv[] = [];
  return {
    rows,
    async save(cv) {
      const index = rows.findIndex((row) => row.id === cv.id);
      if (index === -1) {
        rows.push(cv);
        return;
      }
      rows[index] = cv;
    },
    async findById(id: TailoredCvId) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByProfileAndJob(profileId: ProfileId, jobPostingId: JobPostingId) {
      return rows.find((row) => row.profileId === profileId && row.jobPostingId === jobPostingId) ?? null;
    },
  };
}

describe("generateTailoringProposal", () => {
  it("guarda solo las sugerencias válidas y no vuelve a llamar al modelo si el perfil no cambió", async () => {
    const proposer = proposerReturning(proposals());
    const profiles = memoryProfiles();
    const tailoredCvs = memoryCvs();
    const deps = { profiles, jobPostings: memoryJobs(), tailoredCvs, proposer };

    const first = await generateTailoringProposal(deps, jobId);
    const second = await generateTailoringProposal(deps, jobId);

    expect(proposer.calls).toHaveLength(1);
    expect(proposer.calls[0]?.profile).not.toHaveProperty("contact");
    expect(JSON.stringify(proposer.calls[0]?.profile)).not.toContain("ada@example.com");
    expect(first.suggestions).toHaveLength(1);
    expect(first.suggestions[0]).toMatchObject({
      before: "Mantuve APIs en TypeScript.",
      after: "Mantuve las APIs del servicio en TypeScript.",
      status: "pending",
      validation: { outcome: "valid" },
    });
    expect(first.status).toBe("in_review");
    expect(first.matchResults.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
    expect(tailoredCvs.rows).toHaveLength(1);
  });

  it("vuelve a proponer si el perfil confirmado cambió y conserva el id", async () => {
    const proposer = proposerReturning(proposals());
    const profiles = memoryProfiles();
    const tailoredCvs = memoryCvs();
    const deps = { profiles, jobPostings: memoryJobs(), tailoredCvs, proposer };

    const first = await generateTailoringProposal(deps, jobId);
    tailoredCvs.rows[0] = {
      ...first,
      exports: [
        parseCvExport({
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          createdAt: "2026-11-13T12:00:00.000Z",
          version: 1,
          storageKey: "exports/cv-1.pdf",
        }),
      ],
    };
    profiles.current = { ...confirmedProfile(), summary: "Otro resumen con TypeScript." };

    const second = await generateTailoringProposal(deps, jobId);

    expect(proposer.calls).toHaveLength(2);
    expect(second.id).toBe(first.id);
    expect(second.snapshot.summary).toBe("Otro resumen con TypeScript.");
    expect(second.exports).toHaveLength(1);
    expect(second.suggestions[0]?.before).toBe("Mantuve APIs en TypeScript.");
  });

  it("falla si no hay perfil o la oferta no existe", async () => {
    const proposer = proposerReturning([]);
    await expect(
      generateTailoringProposal(
        { profiles: memoryProfiles(null), jobPostings: memoryJobs(), tailoredCvs: memoryCvs(), proposer },
        jobId,
      ),
    ).rejects.toMatchObject({ code: "profile_not_found" });
    await expect(
      generateTailoringProposal(
        { profiles: memoryProfiles(), jobPostings: memoryJobs(null), tailoredCvs: memoryCvs(), proposer },
        jobId,
      ),
    ).rejects.toMatchObject({ code: "job_not_found" });
    expect(proposer.calls).toHaveLength(0);
  });
});

describe("reviewSuggestion", () => {
  it("acepta, rechaza una edición inventada y cierra la revisión", async () => {
    const proposer = proposerReturning(proposals());
    const profiles = memoryProfiles();
    const jobPostings = memoryJobs();
    const tailoredCvs = memoryCvs();
    const cv = await generateTailoringProposal({ profiles, jobPostings, tailoredCvs, proposer }, jobId);
    const suggestionId = cv.suggestions[0]?.id;
    if (suggestionId === undefined) {
      throw new Error("Falta la sugerencia.");
    }
    const deps = { jobPostings, tailoredCvs };

    const rejectedEdit = await reviewSuggestion(deps, cv.id, suggestionId, {
      type: "edit",
      text: "Mantuve APIs en TypeScript y Kubernetes.",
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(rejectedEdit).toBeInstanceOf(ApplicationError);
    expect(rejectedEdit).toMatchObject({ code: "invalid_suggestion" });
    expect(tailoredCvs.rows[0]?.suggestions[0]?.status).toBe("pending");

    const accepted = await reviewSuggestion(deps, cv.id, suggestionId, { type: "accept" });
    expect(accepted.suggestions[0]?.status).toBe("accepted");
    expect(accepted.status).toBe("final");

    const second = await reviewSuggestion(deps, cv.id, suggestionId, { type: "reject" }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(second).toMatchObject({ code: "invalid_suggestion" });
  });

  it("edita el texto si el guard lo acepta", async () => {
    const proposer = proposerReturning(proposals());
    const jobPostings = memoryJobs();
    const tailoredCvs = memoryCvs();
    const cv = await generateTailoringProposal(
      { profiles: memoryProfiles(), jobPostings, tailoredCvs, proposer },
      jobId,
    );
    const suggestionId = cv.suggestions[0]?.id ?? "";

    const edited = await reviewSuggestion({ jobPostings, tailoredCvs }, cv.id, suggestionId, {
      type: "edit",
      text: "  Mantuve las APIs en TypeScript.  ",
    });

    expect(edited.suggestions[0]).toMatchObject({
      status: "edited",
      after: "Mantuve las APIs en TypeScript.",
      validation: { outcome: "valid" },
    });
    expect(edited.status).toBe("final");
  });
});
