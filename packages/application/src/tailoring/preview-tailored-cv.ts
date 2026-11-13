import { DomainError, profileForRender } from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { CvHtmlRenderer } from "../ports/cv-html-renderer.ts";
import { loadTailoringProposal, type GenerateTailoringProposalDeps } from "./generate-tailoring-proposal.ts";

const PROPOSAL_NOT_FOUND = "Todavía no hay una propuesta para esta oferta.";

export interface PreviewTailoredCvDeps extends Pick<GenerateTailoringProposalDeps, "profiles" | "tailoredCvs"> {
  htmlRenderer: CvHtmlRenderer;
}

export async function previewTailoredCv(deps: PreviewTailoredCvDeps, jobPostingId: string): Promise<string> {
  const cv = await loadTailoringProposal(deps, jobPostingId);
  if (cv === null) {
    throw new ApplicationError("proposal_not_found", PROPOSAL_NOT_FOUND);
  }
  try {
    return deps.htmlRenderer.render(profileForRender(cv));
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", error.message, error);
    }
    throw error;
  }
}
