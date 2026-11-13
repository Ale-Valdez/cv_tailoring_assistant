import { confirmProfile, DomainError, parseProfile, type ConfirmedProfile } from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";

export function confirmReviewedProfile(value: unknown): ConfirmedProfile {
  let profile;
  try {
    profile = parseProfile(value);
  } catch (error) {
    throw profileError(error, "invalid_profile");
  }

  try {
    return confirmProfile(profile);
  } catch (error) {
    throw profileError(error, "profile_not_ready");
  }
}

function profileError(
  error: unknown,
  code: "invalid_profile" | "profile_not_ready",
): ApplicationError {
  if (error instanceof DomainError) {
    return new ApplicationError(code, error.message, error);
  }
  throw error;
}
