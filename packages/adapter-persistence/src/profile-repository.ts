import { ApplicationError, type ProfileRepository } from "@cv-tailor/application";
import { confirmProfile, DomainError, parseProfile, type ConfirmedProfile } from "@cv-tailor/domain";

export interface ProfileRecordStore {
  save(record: { id: string; updatedAt: Date; document: unknown }): Promise<void>;
  findLatest(): Promise<{ document: unknown } | null>;
}

export function createProfileRepository(store: ProfileRecordStore): ProfileRepository {
  return {
    async save(profile: ConfirmedProfile) {
      await store.save({
        id: profile.id,
        updatedAt: new Date(),
        document: JSON.parse(JSON.stringify(profile)) as unknown,
      });
    },
    async findLatest() {
      const row = await store.findLatest();
      if (row === null) {
        return null;
      }
      return readConfirmedProfile(row.document);
    },
  };
}

function readConfirmedProfile(document: unknown): ConfirmedProfile {
  try {
    const profile = parseProfile(document);
    if (profile.status !== "confirmed") {
      throw new ApplicationError("invalid_profile", "El perfil guardado no está confirmado.");
    }
    return confirmProfile(profile);
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_profile", "El perfil guardado no se puede leer.", error);
    }
    throw error;
  }
}
