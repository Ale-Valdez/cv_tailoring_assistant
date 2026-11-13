import type { ConfirmedProfile } from "@cv-tailor/domain";

export interface ProfileRepository {
  save(profile: ConfirmedProfile): Promise<void>;
  findLatest(): Promise<ConfirmedProfile | null>;
}
