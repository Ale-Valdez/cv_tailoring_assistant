import { describe, expect, it } from "vitest";

import { readRuntimeConfig } from "./config.ts";

const shared = {
  DATABASE_URL: "postgresql://cv_tailor:cv_tailor@127.0.0.1:5432/cv_tailor",
  FILES_DIR: ".data/files",
  RENDERER_URL: "http://127.0.0.1:3002/",
  LANGSMITH_TRACING: "false",
};

describe("readRuntimeConfig", () => {
  it("no pide la clave de OpenAI cuando E2E_FIXTURES es true", () => {
    const config = readRuntimeConfig({ ...shared, E2E_FIXTURES: "true" });
    expect(config.fixtures).toBe(true);
    expect(config.rendererUrl).toBe("http://127.0.0.1:3002");
  });

  it("sigue exigiendo OPENAI_API_KEY si las respuestas fijas están apagadas", () => {
    expect(() =>
      readRuntimeConfig({
        ...shared,
        LLM_PROVIDER: "openai",
        LLM_MODEL: "gpt-6-luna",
      }),
    ).toThrow(/OPENAI_API_KEY/);
  });

  it("rechaza un valor de E2E_FIXTURES que no sea true o false", () => {
    expect(() => readRuntimeConfig({ ...shared, E2E_FIXTURES: "yes" })).toThrow(/E2E_FIXTURES/);
  });
});
