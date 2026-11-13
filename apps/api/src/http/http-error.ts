import type { NextFunction, Request, Response } from "express";

import { ApplicationError, type ApplicationErrorCode } from "@cv-tailor/application";

import { logger } from "../logger.ts";

export function writeHttpError(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApplicationError) {
    if (
      error.code === "extraction_failed" ||
      error.code === "analysis_failed" ||
      error.code === "proposal_failed" ||
      error.code === "pdf_failed"
    ) {
      logger.error({ err: error }, `${error.code} failed`);
    }
    response.status(statusFor(error.code)).json({ code: error.code, message: error.message });
    return;
  }

  if (isPayloadTooLarge(error)) {
    if (request.path === "/profiles/import") {
      response.status(413).json({
        code: "pdf_too_large",
        message: "El PDF supera el máximo de 10 MiB.",
      });
      return;
    }
    response.status(413).json({
      code: "payload_too_large",
      message: "El cuerpo de la petición es demasiado grande.",
    });
    return;
  }

  if (isInvalidJson(error)) {
    response.status(400).json({
      code: "invalid_json",
      message: "El cuerpo no es JSON válido.",
    });
    return;
  }

  logger.error({ err: error }, "request failed");
  response.status(500).json({
    code: "internal_error",
    message: "No se pudo completar la operación.",
  });
}

function statusFor(code: ApplicationErrorCode): number {
  if (code === "pdf_too_large" || code === "job_text_too_long" || code === "html_too_large") {
    return 413;
  }
  if (
    code === "extraction_failed" ||
    code === "analysis_failed" ||
    code === "proposal_failed" ||
    code === "pdf_failed"
  ) {
    return 502;
  }
  if (
    code === "profile_not_found" ||
    code === "job_not_found" ||
    code === "proposal_not_found" ||
    code === "suggestion_not_found" ||
    code === "export_not_found"
  ) {
    return 404;
  }
  return 422;
}

function isPayloadTooLarge(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const type = "type" in error ? error.type : undefined;
  const status = "status" in error ? error.status : undefined;
  return type === "entity.too.large" || status === 413;
}

function isInvalidJson(error: unknown): boolean {
  return error instanceof SyntaxError && "status" in error && error.status === 400;
}
