import { ApplicationError, type JobPostingRepository } from "@cv-tailor/application";
import { DomainError, parseJobPosting, type JobPosting, type JobPostingId } from "@cv-tailor/domain";

export interface JobPostingRecordStore {
  save(record: { id: string; contentHash: string; updatedAt: Date; document: unknown }): Promise<void>;
  findById(id: string): Promise<{ document: unknown } | null>;
  findByContentHash(contentHash: string): Promise<{ document: unknown } | null>;
  findLatest(): Promise<{ document: unknown } | null>;
}

export function createJobPostingRepository(store: JobPostingRecordStore): JobPostingRepository {
  return {
    async save(posting: JobPosting) {
      await store.save({
        id: posting.id,
        contentHash: posting.contentHash,
        updatedAt: new Date(),
        document: JSON.parse(JSON.stringify(posting)) as unknown,
      });
    },
    async findById(id: JobPostingId) {
      const row = await store.findById(id);
      return row === null ? null : readJobPosting(row.document);
    },
    async findByContentHash(contentHash: string) {
      const row = await store.findByContentHash(contentHash);
      return row === null ? null : readJobPosting(row.document);
    },
    async findLatest() {
      const row = await store.findLatest();
      return row === null ? null : readJobPosting(row.document);
    },
  };
}

function readJobPosting(document: unknown): JobPosting {
  try {
    return parseJobPosting(document);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_job", "La oferta guardada no se puede leer.", error);
    }
    throw error;
  }
}
