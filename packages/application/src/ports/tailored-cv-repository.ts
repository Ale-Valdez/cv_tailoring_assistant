import type { JobPostingId, ProfileId, TailoredCv, TailoredCvId } from "@cv-tailor/domain";

export interface TailoredCvRepository {
  save(cv: TailoredCv): Promise<void>;
  findById(id: TailoredCvId): Promise<TailoredCv | null>;
  findByProfileAndJob(profileId: ProfileId, jobPostingId: JobPostingId): Promise<TailoredCv | null>;
}
