import type { NextFunction, Request, Response } from "express";

import { analyzeJobRequestSchema } from "@cv-tailor/contracts";

import type { AppServices } from "../compose.ts";

export function analyzeJob(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = analyzeJobRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          code: "invalid_job_text",
          message: "La oferta tiene que enviarse como texto.",
        });
        return;
      }
      response.json(await services.analyzeJobPosting(parsed.data.text));
    } catch (error) {
      next(error);
    }
  };
}

export function loadCurrentJob(services: AppServices) {
  return async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const posting = await services.loadLatestJobPosting();
      if (posting === null) {
        response.status(404).json({
          code: "job_not_found",
          message: "Todavía no hay una oferta analizada.",
        });
        return;
      }
      response.json(posting);
    } catch (error) {
      next(error);
    }
  };
}

export function loadJob(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await services.loadJobPosting(pathParam(request.params.id)));
    } catch (error) {
      next(error);
    }
  };
}

export function matchJob(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await services.matchJobPosting(pathParam(request.params.id)));
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
