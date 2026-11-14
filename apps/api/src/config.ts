import { readModelConfig, type ModelConfig } from "@cv-tailor/adapter-ai";

type SharedRuntime = {
  databaseUrl: string;
  langsmithTracing: boolean;
  filesDir: string;
  rendererUrl: string;
};

export type RuntimeConfig = SharedRuntime & ({ fixtures: true } | { fixtures: false; model: ModelConfig });

type Env = Record<string, string | undefined>;

export function readRuntimeConfig(env: Env): RuntimeConfig {
  const fixturesRaw = env.E2E_FIXTURES?.trim() ?? "false";
  if (fixturesRaw !== "true" && fixturesRaw !== "false") {
    throw new Error('E2E_FIXTURES debe ser "true" o "false".');
  }
  const fixtures = fixturesRaw === "true";
  const model = fixtures ? null : readModelConfig(env);

  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  if (databaseUrl.length === 0) {
    throw new Error("Falta DATABASE_URL.");
  }
  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL debe empezar por postgresql:// o postgres://.");
  }

  const tracingRaw = env.LANGSMITH_TRACING ?? "false";
  if (tracingRaw !== "true" && tracingRaw !== "false") {
    throw new Error('LANGSMITH_TRACING debe ser "true" o "false".');
  }

  const langsmithTracing = tracingRaw === "true";
  if (langsmithTracing && (env.LANGSMITH_API_KEY?.trim() ?? "").length === 0) {
    throw new Error("LANGSMITH_TRACING=true exige LANGSMITH_API_KEY.");
  }
  if (langsmithTracing && (env.LANGSMITH_PROJECT?.trim() ?? "").length === 0) {
    throw new Error("LANGSMITH_TRACING=true exige LANGSMITH_PROJECT.");
  }

  const filesDir = env.FILES_DIR?.trim() ?? "";
  if (filesDir.length === 0) {
    throw new Error("Falta FILES_DIR.");
  }
  const rendererUrl = (env.RENDERER_URL?.trim() ?? "").replace(/\/$/, "");
  if (rendererUrl.length === 0) {
    throw new Error("Falta RENDERER_URL.");
  }

  const shared = { databaseUrl, langsmithTracing, filesDir, rendererUrl };
  if (model === null) {
    return { ...shared, fixtures: true };
  }
  return { ...shared, fixtures: false, model };
}

export function readPort(raw: string | undefined): number {
  const port = Number(raw ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535.");
  }
  return port;
}
