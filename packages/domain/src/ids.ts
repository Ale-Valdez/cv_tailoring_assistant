import { z } from "zod";

import { DomainError } from "./errors.ts";

function idSchema<Brand extends string>() {
  return z.uuid().brand<Brand>();
}

export const profileIdSchema = idSchema<"ProfileId">();
export type ProfileId = z.infer<typeof profileIdSchema>;

export const experienceIdSchema = idSchema<"ExperienceId">();
export type ExperienceId = z.infer<typeof experienceIdSchema>;

export const educationIdSchema = idSchema<"EducationId">();
export type EducationId = z.infer<typeof educationIdSchema>;

export const skillIdSchema = idSchema<"SkillId">();
export type SkillId = z.infer<typeof skillIdSchema>;

export const projectIdSchema = idSchema<"ProjectId">();
export type ProjectId = z.infer<typeof projectIdSchema>;

export const bulletIdSchema = idSchema<"BulletId">();
export type BulletId = z.infer<typeof bulletIdSchema>;

export const jobPostingIdSchema = idSchema<"JobPostingId">();
export type JobPostingId = z.infer<typeof jobPostingIdSchema>;

export const requirementIdSchema = idSchema<"RequirementId">();
export type RequirementId = z.infer<typeof requirementIdSchema>;

export const keywordIdSchema = idSchema<"KeywordId">();
export type KeywordId = z.infer<typeof keywordIdSchema>;

export const tailoredCvIdSchema = idSchema<"TailoredCvId">();
export type TailoredCvId = z.infer<typeof tailoredCvIdSchema>;

export const suggestionIdSchema = idSchema<"SuggestionId">();
export type SuggestionId = z.infer<typeof suggestionIdSchema>;

export const matchResultIdSchema = idSchema<"MatchResultId">();
export type MatchResultId = z.infer<typeof matchResultIdSchema>;

export const exportIdSchema = idSchema<"ExportId">();
export type ExportId = z.infer<typeof exportIdSchema>;

function randomUuid(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID === undefined) {
    throw new DomainError("id_unavailable", "Este entorno no puede generar UUID.");
  }
  return cryptoApi.randomUUID();
}

export function createProfileId(): ProfileId {
  return profileIdSchema.parse(randomUuid());
}

export function createExperienceId(): ExperienceId {
  return experienceIdSchema.parse(randomUuid());
}

export function createEducationId(): EducationId {
  return educationIdSchema.parse(randomUuid());
}

export function createSkillId(): SkillId {
  return skillIdSchema.parse(randomUuid());
}

export function createProjectId(): ProjectId {
  return projectIdSchema.parse(randomUuid());
}

export function createBulletId(): BulletId {
  return bulletIdSchema.parse(randomUuid());
}

export function createJobPostingId(): JobPostingId {
  return jobPostingIdSchema.parse(randomUuid());
}

export function createRequirementId(): RequirementId {
  return requirementIdSchema.parse(randomUuid());
}

export function createKeywordId(): KeywordId {
  return keywordIdSchema.parse(randomUuid());
}

export function createTailoredCvId(): TailoredCvId {
  return tailoredCvIdSchema.parse(randomUuid());
}

export function createSuggestionId(): SuggestionId {
  return suggestionIdSchema.parse(randomUuid());
}

export function createMatchResultId(): MatchResultId {
  return matchResultIdSchema.parse(randomUuid());
}

export function createExportId(): ExportId {
  return exportIdSchema.parse(randomUuid());
}
