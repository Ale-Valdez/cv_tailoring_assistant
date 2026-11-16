export { dateSpanSchema, yearMonthSchema, type DateSpan } from "./date-span.ts";
export { DomainError, domainErrorCodes, type DomainErrorCode } from "./errors.ts";
export {
  bulletIdSchema,
  createBulletId,
  createEducationId,
  createExperienceId,
  createExportId,
  createJobPostingId,
  createKeywordId,
  createMatchResultId,
  createProfileId,
  createProjectId,
  createRequirementId,
  createSkillId,
  createSuggestionId,
  createTailoredCvId,
  educationIdSchema,
  experienceIdSchema,
  exportIdSchema,
  jobPostingIdSchema,
  keywordIdSchema,
  matchResultIdSchema,
  profileIdSchema,
  projectIdSchema,
  requirementIdSchema,
  skillIdSchema,
  suggestionIdSchema,
  tailoredCvIdSchema,
  type BulletId,
  type EducationId,
  type ExperienceId,
  type ExportId,
  type JobPostingId,
  type KeywordId,
  type MatchResultId,
  type ProfileId,
  type ProjectId,
  type RequirementId,
  type SkillId,
  type SuggestionId,
  type TailoredCvId,
} from "./ids.ts";
export { parseJobPosting, jobPostingSchema, type JobPosting } from "./job/job-posting.ts";
export { keywordSchema, type Keyword } from "./job/keyword.ts";
export {
  foldTerm,
  normalizeKeywordDrafts,
  type KeywordDraft,
} from "./job/normalize-keywords.ts";
export {
  requirementKindSchema,
  requirementPrioritySchema,
  requirementSchema,
  type Requirement,
  type RequirementKind,
  type RequirementPriority,
} from "./job/requirement.ts";
export { bulletSchema, type Bullet } from "./profile/bullet.ts";
export { contactLinkSchema, contactSchema, type Contact, type ContactLink } from "./profile/contact.ts";
export {
  languageLevelSchema,
  languageSkillSchema,
  type LanguageLevel,
  type LanguageSkill,
} from "./profile/language-skill.ts";
export { educationSchema, type Education } from "./profile/education.ts";
export { experienceSchema, type Experience } from "./profile/experience.ts";
export {
  confirmProfile,
  listBulletIds,
  parseProfile,
  profileForModel,
  profileSchema,
  profileStatusSchema,
  type ConfirmedProfile,
  type Profile,
  type ProfileForModel,
  type ProfileStatus,
} from "./profile/profile.ts";
export { projectSchema, type Project } from "./profile/project.ts";
export { skillEntrySchema, skillSourceSchema, type SkillEntry, type SkillSource } from "./profile/skill.ts";
export { profileForRender } from "./tailoring/apply-suggestions.ts";
export { cvExportSchema, parseCvExport, type CvExport } from "./tailoring/cv-export.ts";
export { checkFabrication, type FabricationDraft } from "./tailoring/fabrication-guard.ts";
export { matchResultSchema, matchStatusSchema, parseMatchResult, type MatchResult, type MatchStatus } from "./tailoring/match-result.ts";
export {
  jobMatchReportSchema,
  matchProfileToJob,
  type CitedBullet,
  type JobMatchReport,
  type KeywordCoverage,
} from "./tailoring/match-profile.ts";
export {
  assessBulletOrder,
  bulletOrderContainer,
  bulletOrderOwnerSchema,
  evidenceFitsProfile,
  evidenceRefSchema,
  parseSuggestion,
  reviewSuggestion,
  suggestionFitProblems,
  suggestionSchema,
  suggestionStatusSchema,
  suggestionTargetSchema,
  suggestionValidationSchema,
  type BulletOrderOwner,
  type EvidenceRef,
  type ReviewDecision,
  type Suggestion,
  type SuggestionStatus,
  type SuggestionTarget,
  type SuggestionValidation,
} from "./tailoring/suggestion.ts";
export {
  parseTailoredCv,
  tailoredCvSchema,
  tailoredCvStatusFor,
  tailoredCvStatusSchema,
  type TailoredCv,
  type TailoredCvStatus,
} from "./tailoring/tailored-cv.ts";
