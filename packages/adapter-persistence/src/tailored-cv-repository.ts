import { ApplicationError, type TailoredCvRepository } from "@cv-tailor/application";
import {
  DomainError,
  parseTailoredCv,
  type JobPostingId,
  type ProfileId,
  type TailoredCv,
  type TailoredCvId,
} from "@cv-tailor/domain";

export interface TailoredCvRecordStore {
  save(record: {
    id: string;
    profileId: string;
    jobPostingId: string;
    updatedAt: Date;
    document: unknown;
  }): Promise<void>;
  findById(id: string): Promise<{ document: unknown } | null>;
  findByProfileAndJob(profileId: string, jobPostingId: string): Promise<{ document: unknown } | null>;
}

export function createTailoredCvRepository(store: TailoredCvRecordStore): TailoredCvRepository {
  return {
    async save(cv: TailoredCv) {
      await store.save({
        id: cv.id,
        profileId: cv.profileId,
        jobPostingId: cv.jobPostingId,
        updatedAt: new Date(),
        document: JSON.parse(JSON.stringify(cv)) as unknown,
      });
    },
    async findById(id: TailoredCvId) {
      const row = await store.findById(id);
      return row === null ? null : readTailoredCv(row.document);
    },
    async findByProfileAndJob(profileId: ProfileId, jobPostingId: JobPostingId) {
      const row = await store.findByProfileAndJob(profileId, jobPostingId);
      return row === null ? null : readTailoredCv(row.document);
    },
  };
}

function readTailoredCv(document: unknown): TailoredCv {
  try {
    return parseTailoredCv(document);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", "La propuesta guardada no se puede leer.", error);
    }
    throw error;
  }
}
