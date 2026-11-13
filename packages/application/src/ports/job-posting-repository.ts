import type { JobPosting, JobPostingId } from "@cv-tailor/domain";

export interface JobPostingRepository {
  save(posting: JobPosting): Promise<void>;
  findById(id: JobPostingId): Promise<JobPosting | null>;
  findByContentHash(contentHash: string): Promise<JobPosting | null>;
  findLatest(): Promise<JobPosting | null>;
}
