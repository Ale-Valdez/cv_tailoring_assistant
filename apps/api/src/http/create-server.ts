import { healthResponseSchema } from "@cv-tailor/contracts";
import express from "express";

export function createServer() {
  const app = express();

  app.get("/health", (_request, response) => {
    response.json(healthResponseSchema.parse({ status: "ok" }));
  });

  return app;
}
