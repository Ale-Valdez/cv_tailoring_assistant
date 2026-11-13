export const applicationErrorCodes = [
  "empty_pdf",
  "pdf_too_large",
  "pdf_without_text",
  "pdf_unreadable",
  "extraction_failed",
  "invalid_profile",
  "profile_not_ready",
  "profile_not_found",
  "empty_job_text",
  "job_text_too_long",
  "analysis_failed",
  "invalid_job",
  "job_not_found",
  "proposal_failed",
  "proposal_not_found",
  "suggestion_not_found",
  "invalid_suggestion",
  "invalid_tailored_cv",
  "invalid_html",
  "html_too_large",
  "pdf_failed",
  "export_not_ready",
  "export_not_found",
  "invalid_storage_key",
] as const;

export type ApplicationErrorCode = (typeof applicationErrorCodes)[number];

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApplicationError";
    this.code = code;
  }
}
