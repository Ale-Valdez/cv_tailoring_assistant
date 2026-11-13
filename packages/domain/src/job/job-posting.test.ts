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
