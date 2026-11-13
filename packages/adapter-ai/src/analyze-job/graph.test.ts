import { ApplicationError } from "@cv-tailor/application";
import { describe, expect, it } from "vitest";

import { ANALYZE_JOB_MAX_ATTEMPTS, runAnalyzeJobGraph } from "./graph.ts";

const validDraft = {
  title: "Backend",
  company: "",
  language: "es",
  requirements: [{ text: "Mantener APIs", kind: "technical", priority: "required" }],
  keywords: [{ canonical: "PostgreSQL", aliases: ["Postgres"], frequency: 1, origin: "requisitos" }],
};

describe("runAnalyzeJobGraph", () => {
  it("reintenta cuando el esquema falla y descarta requisitos vacíos", async () => {
    const calls: Array<string | null> = [];
    const job = await runAnalyzeJobGraph("Oferta de prueba", {
      async structure(input) {
        calls.push(input.previousError);
        if (calls.length === 1) {
          return {
            ...validDraft,
            requirements: [{ text: "Mantener APIs", kind: "otra", priority: "required" }],
          };
        }
        return {
          ...validDraft,
          requirements: [...validDraft.requirements, { text: "   ", kind: "technical", priority: "required" }],
        };
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toBeNull();
    expect(calls[1]).toContain("kind");
    expect(job.company).toBeNull();
    expect(job.requirements).toHaveLength(1);
    expect(job.keywords[0]?.canonical).toBe("PostgreSQL");
  });

  it("se detiene después de los intentos máximos", async () => {
    let calls = 0;
    const error = await runAnalyzeJobGraph("Oferta de prueba", {
      async structure() {
        calls += 1;
        throw new Error("salida inválida");
      },
    }).then(
      () => {
        throw new Error("Se esperaba un ApplicationError.");
      },
      (caught: unknown) => caught,
    );

    expect(calls).toBe(ANALYZE_JOB_MAX_ATTEMPTS);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: "analysis_failed",
      message: "No se pudo analizar la oferta.",
    });
    if (error instanceof ApplicationError) {
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.message).not.toContain("salida inválida");
    }
  });
});
