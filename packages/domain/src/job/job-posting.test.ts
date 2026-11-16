import { describe, expect, it } from "vitest";

import { DomainError } from "../errors.ts";
import { parseJobPosting } from "./job-posting.ts";

const postingId = "12121212-1212-4121-8121-121212121212";
const requirementId = "13131313-1313-4131-8131-131313131313";
const keywordId = "14141414-1414-4141-8141-141414141414";

function postingInput(overrides: Record<string, unknown> = {}) {
  return {
    id: postingId,
    rawText: "Buscamos a alguien que mantenga APIs.",
    title: "Backend",
    company: "Ejemplo",
    language: "es",
    contentHash: "abc123",
    requirements: [
      {
        id: requirementId,
        text: "Mantener APIs",
        kind: "technical",
        priority: "required",
      },
    ],
    keywords: [
      {
        id: keywordId,
        canonical: "TypeScript",
        aliases: ["TS"],
        frequency: 2,
        origin: "posting",
      },
    ],
    ...overrides,
  };
}

function domainFailure(run: () => unknown): DomainError {
  try {
    run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("Se esperaba un DomainError.");
}

describe("parseJobPosting", () => {
  it("acepta una oferta con requisito y keyword", () => {
    const posting = parseJobPosting(postingInput());
    expect(posting.requirements).toHaveLength(1);
    expect(posting.keywords[0]?.canonical).toBe("TypeScript");
  });

  // Fase 3 del plan de auditoría (ADR-027): un documento guardado antes de
  // esa fase no tiene `keywordIds` en sus requisitos.
  it("normaliza un requisito sin keywordIds (documento guardado antes de la Fase 3) a una lista vacía", () => {
    const input = postingInput();
    const requirement = input.requirements[0] as Record<string, unknown>;
    delete requirement.keywordIds;

    const posting = parseJobPosting(input);

    expect(posting.requirements[0]?.keywordIds).toEqual([]);
  });

  it("acepta un requisito que cita la keyword de la oferta", () => {
    const posting = parseJobPosting(
      postingInput({
        requirements: [
          { id: requirementId, text: "Mantener APIs", kind: "technical", priority: "required", keywordIds: [keywordId] },
        ],
      }),
    );

    expect(posting.requirements[0]?.keywordIds).toEqual([keywordId]);
  });

  it("rechaza un requisito que repite la misma keyword", () => {
    const error = domainFailure(() =>
      parseJobPosting(
        postingInput({
          requirements: [
            {
              id: requirementId,
              text: "Mantener APIs",
              kind: "technical",
              priority: "required",
              keywordIds: [keywordId, keywordId],
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("repetir la misma keyword");
  });

  it("rechaza un requisito que cita una keyword que no está en la oferta", () => {
    const otherKeywordId = "16161616-1616-4161-8161-161616161616";
    const error = domainFailure(() =>
      parseJobPosting(
        postingInput({
          requirements: [
            {
              id: requirementId,
              text: "Mantener APIs",
              kind: "technical",
              priority: "required",
              keywordIds: [otherKeywordId],
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("solo puede citar keywords que están en la oferta");
  });

  it("rechaza requisitos con el mismo id", () => {
    const requirement = postingInput().requirements[0];
    const error = domainFailure(() =>
      parseJobPosting(postingInput({ requirements: [requirement, requirement] })),
    );
    expect(error.message).toContain("mismo identificador");
  });

  it("rechaza un alias igual al término canónico", () => {
    const error = domainFailure(() =>
      parseJobPosting(
        postingInput({
          keywords: [
            {
              id: keywordId,
              canonical: "TypeScript",
              aliases: ["typescript"],
              frequency: 1,
              origin: "posting",
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("alias");
  });
});
