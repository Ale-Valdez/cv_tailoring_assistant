import {
  checkFabrication,
  DomainError,
  parseTailoredCv,
  reviewSuggestion as applyReviewDecision,
  suggestionIdSchema,
  tailoredCvIdSchema,
  tailoredCvStatusFor,
  type ReviewDecision,
  type TailoredCv,
} from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import type { TailoredCvRepository } from "../ports/tailored-cv-repository.ts";

const PROPOSAL_NOT_FOUND = "No hay una propuesta con ese identificador.";
const SUGGESTION_NOT_FOUND = "No hay una sugerencia con ese identificador.";
const JOB_NOT_FOUND = "No hay una oferta con ese identificador.";

export interface ReviewSuggestionDeps {
  jobPostings: JobPostingRepository;
  tailoredCvs: TailoredCvRepository;
}

export async function reviewSuggestion(
  deps: ReviewSuggestionDeps,
  tailoredCvId: string,
  suggestionId: string,
  decision: ReviewDecision,
): Promise<TailoredCv> {
  const cvId = tailoredCvIdSchema.safeParse(tailoredCvId);
  if (!cvId.success) {
    throw new ApplicationError("proposal_not_found", PROPOSAL_NOT_FOUND);
  }
  const currentId = suggestionIdSchema.safeParse(suggestionId);
  if (!currentId.success) {
    throw new ApplicationError("suggestion_not_found", SUGGESTION_NOT_FOUND);
  }
  const cv = await deps.tailoredCvs.findById(cvId.data);
  if (cv === null) {
    throw new ApplicationError("proposal_not_found", PROPOSAL_NOT_FOUND);
  }
  const current = cv.suggestions.find((suggestion) => suggestion.id === currentId.data);
  if (current === undefined) {
    throw new ApplicationError("suggestion_not_found", SUGGESTION_NOT_FOUND);
  }

  let reviewed;
  try {
    reviewed = applyReviewDecision(current, decision);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_suggestion", error.message, error);
    }
    throw error;
  }

  if (decision.type === "edit") {
    const job = await deps.jobPostings.findById(cv.jobPostingId);
    if (job === null) {
      throw new ApplicationError("job_not_found", JOB_NOT_FOUND);
    }
    const validation = checkFabrication(cv.snapshot, job, reviewed);
    if (validation.outcome !== "valid") {
      throw new ApplicationError("invalid_suggestion", validation.reasons.join(" "));
    }
    reviewed = { ...reviewed, validation };
  }

  const suggestions = cv.suggestions.map((suggestion) => (suggestion.id === reviewed.id ? reviewed : suggestion));
  try {
    const updated = parseTailoredCv({
      ...cv,
      suggestions,
      status: tailoredCvStatusFor(suggestions),
    });
    await deps.tailoredCvs.save(updated);
    return updated;
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", error.message, error);
    }
    throw error;
  }
}
