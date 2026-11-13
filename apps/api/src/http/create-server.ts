import express, { type Express, type NextFunction, type Request, type Response } from "express";

import { MAX_JOB_TEXT_CHARS, MAX_PDF_BYTES } from "@cv-tailor/application";
import { healthResponseSchema, privacyResponseSchema } from "@cv-tailor/contracts";

import type { AppServices } from "../compose.ts";
import { writeHttpError } from "./http-error.ts";
import { analyzeJob, loadCurrentJob, loadJob, matchJob } from "./jobs.ts";
import { confirmProfile, importProfile, loadProfile } from "./profiles.ts";
import {
  downloadProposalExport,
  exportProposal,
  generateProposal,
  loadProposal,
  previewProposal,
  reviewProposalSuggestion,
} from "./proposals.ts";

export function createServer(services: AppServices): Express {
  const app = express();
  app.set("services", services);

  app.get("/health", (_request, response) => {
    response.json(healthResponseSchema.parse({ status: "ok" }));
  });

  app.get("/privacy", (_request, response) => {
    response.json(
      privacyResponseSchema.parse({
        langsmithTracing: services.langsmithTracing,
        maxPdfBytes: MAX_PDF_BYTES,
        maxJobTextChars: MAX_JOB_TEXT_CHARS,
      }),
    );
  });

  app.post(
    "/profiles/import",
    express.raw({ type: "application/pdf", limit: MAX_PDF_BYTES }),
    importProfile(services),
  );

  app.get("/profiles/current", loadProfile(services));

  app.post("/profiles/confirm", express.json({ limit: "1mb" }), confirmProfile(services));

  app.post("/jobs/analyze", express.json({ limit: "1mb" }), analyzeJob(services));
  app.get("/jobs/current", loadCurrentJob(services));
  app.get("/jobs/:id/match", matchJob(services));
  app.post("/jobs/:id/proposals", generateProposal(services));
  app.get("/jobs/:id/proposal/preview", previewProposal(services));
  app.post("/jobs/:id/proposal/export", exportProposal(services));
  app.get("/jobs/:id/proposal/exports/:exportId", downloadProposalExport(services));
  app.get("/jobs/:id/proposal", loadProposal(services));
  app.get("/jobs/:id", loadJob(services));
  app.post(
    "/proposals/:id/suggestions/:suggestionId/review",
    express.json({ limit: "1mb" }),
    reviewProposalSuggestion(services),
  );

  app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
    writeHttpError(error, request, response, next);
  });

  return app;
}
