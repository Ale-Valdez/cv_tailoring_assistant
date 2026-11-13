export const domainErrorCodes = [
  "invalid_input",
  "id_unavailable",
  "profile_not_ready",
  "invalid_transition",
] as const;

export type DomainErrorCode = (typeof domainErrorCodes)[number];

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
