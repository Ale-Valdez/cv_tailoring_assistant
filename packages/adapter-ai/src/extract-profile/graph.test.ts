import { ApplicationError } from "@cv-tailor/application";
import { describe, expect, it } from "vitest";

import { EXTRACT_PROFILE_MAX_ATTEMPTS, runExtractProfileGraph } from "./graph.ts";

const validDraft = {
  summary: "Desarrolla servicios.",
  language: "es",
  experiences: [
    {
      organization: "Analytical Engines",
      role: "Desarrolladora",
      span: { start: "2020-01", end: null, ongoing: true },
      location: "",
      bullets: ["Mantuve APIs en TypeScript."],
    },
  ],
  education: [],
  skills: [{ name: "TypeScript" }],
  projects: [],
};

describe("runExtractProfileGraph", () => {
  it("reintenta cuando el esquema falla y devuelve el intento válido", async () => {
    const calls: Array<string | null> = [];
    const profile = await runExtractProfileGraph("CV de prueba", {
      async structure(input) {
        calls.push(input.previousError);
        if (calls.length === 1) {
          return {
            ...validDraft,
            experiences: [
              {
                ...validDraft.experiences[0],
                span: { start: "2024-05", end: "2020-01", ongoing: false },
              },
            ],
          };
        }
        return validDraft;
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toBeNull();
    expect(calls[1]).toContain("fecha de fin es anterior");
    expect(profile.language).toBe("es");
    expect(profile.experiences[0]?.location).toBeNull();
    expect(profile.experiences[0]?.span).toEqual({ start: "2020-01", end: null, ongoing: true });
  });

  it("se detiene después de los intentos máximos", async () => {
    let calls = 0;
    const error = await runExtractProfileGraph("CV de prueba", {
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

    expect(calls).toBe(EXTRACT_PROFILE_MAX_ATTEMPTS);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: "extraction_failed",
      message: "No se pudo estructurar el CV.",
    });
    if (error instanceof ApplicationError) {
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.message).not.toContain("salida inválida");
    }
  });
});
