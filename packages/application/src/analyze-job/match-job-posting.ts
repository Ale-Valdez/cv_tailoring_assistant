import { DomainError, jobPostingIdSchema, matchProfileToJob, type JobMatchReport, type JobPosting } from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";

const JOB_NOT_FOUND = "No hay una oferta con ese identificador.";

export interface MatchJobPostingDeps {
  profiles: ProfileRepository;
  jobPostings: JobPostingRepository;
}

export async function loadLatestJobPosting(jobPostings: JobPostingRepository): Promise<JobPosting | null> {
  return jobPostings.findLatest();
}

export async function loadJobPosting(jobPostings: JobPostingRepository, jobPostingId: string): Promise<JobPosting> {
  const id = jobPostingIdSchema.safeParse(jobPostingId);
  if (!id.success) {
    throw new ApplicationError("job_not_found", JOB_NOT_FOUND);
  }
  const posting = await jobPostings.findById(id.data);
  if (posting === null) {
    throw new ApplicationError("job_not_found", JOB_NOT_FOUND);
  }
  return posting;
}

export async function matchJobPosting(deps: MatchJobPostingDeps, jobPostingId: string): Promise<JobMatchReport> {
  const profile = await deps.profiles.findLatest();
  if (profile === null) {
    throw new ApplicationError("profile_not_found", "Todavía no hay un perfil confirmado.");
  }
  const posting = await loadJobPosting(deps.jobPostings, jobPostingId);
  try {
    return matchProfileToJob(profile, posting);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_job", error.message, error);
    }
    throw error;
  }
}
