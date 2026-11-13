import type { ConfirmedProfile } from "@cv-tailor/domain";

import { confirmReviewedProfile } from "../import-profile/confirm-reviewed-profile.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";

export async function storeConfirmedProfile(
  profiles: ProfileRepository,
  value: unknown,
): Promise<ConfirmedProfile> {
  const profile = confirmReviewedProfile(value);
  await profiles.save(profile);
  return profile;
}

export function loadConfirmedProfile(profiles: ProfileRepository): Promise<ConfirmedProfile | null> {
  return profiles.findLatest();
}
