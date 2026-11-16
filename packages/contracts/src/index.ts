import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const privacyResponseSchema = z.object({
  langsmithTracing: z.boolean(),
  maxPdfBytes: z.number().int().positive(),
  maxJobTextChars: z.number().int().positive(),
});

export type PrivacyResponse = z.infer<typeof privacyResponseSchema>;

export const analyzeJobRequestSchema = z.object({
  text: z.string(),
});

export type AnalyzeJobRequest = z.infer<typeof analyzeJobRequestSchema>;

export const reviewSuggestionRequestSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("accept") }),
  z.object({ decision: z.literal("reject") }),
  z.object({ decision: z.literal("edit"), text: z.string() }),
]);

export type ReviewSuggestionRequest = z.infer<typeof reviewSuggestionRequestSchema>;

export { profileSchema, type ConfirmedProfile, type Profile, type ProfileStatus } from "@cv-tailor/domain";

export type {
  Bullet,
  CitedBullet,
  Contact,
  ContactLink,
  LanguageLevel,
  LanguageSkill,
  DateSpan,
  Education,
  Experience,
  JobMatchReport,
  JobPosting,
  Keyword,
  KeywordCoverage,
  MatchResult,
  MatchStatus,
  Project,
  Suggestion,
  SuggestionStatus,
  TailoredCv,
  Requirement,
  SkillEntry,
  SkillSource,
} from "@cv-tailor/domain";

export { jobMatchReportSchema, jobPostingSchema, tailoredCvSchema } from "@cv-tailor/domain";
