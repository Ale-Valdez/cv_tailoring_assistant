import type { NextFunction, Request, Response } from "express";

import type { AppServices } from "../compose.ts";

const PDF_MEDIA_TYPE = "El archivo tiene que ser un PDF (application/pdf).";

export function importProfile(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!Buffer.isBuffer(request.body)) {
        response.status(415).json({
          code: "unsupported_media_type",
          message: PDF_MEDIA_TYPE,
        });
        return;
      }
      const profile = await services.importProfileFromPdf(new Uint8Array(request.body));
      response.json(profile);
    } catch (error) {
      next(error);
    }
  };
}

export function confirmProfile(services: AppServices) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await services.storeConfirmedProfile(request.body));
    } catch (error) {
      next(error);
    }
  };
}

export function loadProfile(services: AppServices) {
  return async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await services.loadConfirmedProfile();
      if (profile === null) {
        response.status(404).json({
          code: "profile_not_found",
          message: "Todavía no hay un perfil confirmado.",
        });
        return;
      }
      response.json(profile);
    } catch (error) {
      next(error);
    }
  };
}
