import type { NextFunction, Request, Response } from "express";

import { reviewSuggestionRequestSchema } from "@cv-tailor/contracts";

import type { AppServices } from "../compose.ts";

export function generateProposal(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await services.generateTailoringProposal(pathParam(request.params.id)));
    } catch (error) {
      next(error);
    }
  };
}

export function loadProposal(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const proposal = await services.loadTailoringProposal(pathParam(request.params.id));
      if (proposal === null) {
        response.status(404).json({
          code: "proposal_not_found",
          message: "Todavía no hay una propuesta para esta oferta.",
        });
        return;
      }
      response.json(proposal);
    } catch (error) {
      next(error);
    }
  };
}

export function reviewProposalSuggestion(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = reviewSuggestionRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          code: "invalid_review",
          message: "La revisión tiene que ser aceptar, editar o rechazar.",
        });
        return;
      }
      const decision =
        parsed.data.decision === "edit"
          ? { type: "edit" as const, text: parsed.data.text }
          : { type: parsed.data.decision };
      response.json(
        await services.reviewSuggestion(pathParam(request.params.id), pathParam(request.params.suggestionId), decision),
      );
    } catch (error) {
      next(error);
    }
  };
}

function pathParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
