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

export function exportProposal(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await services.exportTailoredCv(pathParam(request.params.id)));
    } catch (error) {
      next(error);
    }
  };
}

export function downloadProposalExport(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await services.loadTailoredCvExport(pathParam(request.params.id), pathParam(request.params.exportId));
      response.setHeader("content-type", "application/pdf");
      response.setHeader("content-disposition", contentDisposition(file.filename));
      response.send(Buffer.from(file.bytes));
    } catch (error) {
      next(error);
    }
  };
}

export function previewProposal(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const html = await services.previewTailoredCv(pathParam(request.params.id));
      response.type("html").send(html);
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

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function pathParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
