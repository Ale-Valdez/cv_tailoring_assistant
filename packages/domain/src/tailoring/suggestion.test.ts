import { describe, expect, it } from "vitest";

import { DomainError } from "../errors.ts";
import { parseSuggestion, reviewSuggestion, type Suggestion } from "./suggestion.ts";

const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bulletId = "33333333-3333-4333-8333-333333333333";

function pendingSuggestion(overrides: Record<string, unknown> = {}): Suggestion {
  return parseSuggestion({
    id: suggestionId,
    target: { type: "bullet", bulletId },
    before: "Mantuve APIs.",
    after: "Mantuve APIs en TypeScript.",
    reason: "La oferta nombra TypeScript y el bullet ya lo respalda.",
    evidence: [{ type: "bullet", bulletId }],
    status: "pending",
    validation: { outcome: "valid" },
    ...overrides,
  });
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

describe("parseSuggestion", () => {
  it("exige al menos una evidencia", () => {
    const error = domainFailure(() => pendingSuggestion({ evidence: [] }));
    expect(error.code).toBe("invalid_input");
    expect(error.message).toContain("evidencia");
  });
});

describe("reviewSuggestion", () => {
  it("acepta una sugerencia pendiente sin cambiar la original", () => {
    const pending = pendingSuggestion();
    const accepted = reviewSuggestion(pending, { type: "accept" });
    expect(accepted.status).toBe("accepted");
    expect(accepted.validation).toEqual({ outcome: "valid" });
    expect(pending.status).toBe("pending");
  });

  it("editar sustituye el texto y deja la validación sin chequear", () => {
    const edited = reviewSuggestion(pendingSuggestion(), {
      type: "edit",
      text: "  Mantuve las APIs del servicio.  ",
    });
    expect(edited.status).toBe("edited");
    expect(edited.after).toBe("Mantuve las APIs del servicio.");
    expect(edited.validation).toEqual({ outcome: "not_checked" });
  });

  it("rechaza un texto editado vacío", () => {
    const error = domainFailure(() => reviewSuggestion(pendingSuggestion(), { type: "edit", text: "  " }));
    expect(error.code).toBe("invalid_input");
  });

  it("rechaza la sugerencia", () => {
    const rejected = reviewSuggestion(pendingSuggestion(), { type: "reject" });
    expect(rejected.status).toBe("rejected");
    expect(rejected.after).toBe("Mantuve APIs en TypeScript.");
  });

  it("no acepta una sugerencia que el fabrication guard no dio por válida", () => {
    const error = domainFailure(() =>
      reviewSuggestion(pendingSuggestion({ validation: { outcome: "not_checked" } }), { type: "accept" }),
    );
    expect(error.code).toBe("invalid_transition");
    expect(error.message).toContain("fabrication guard");
  });

  it("no permite una segunda revisión", () => {
    const accepted = reviewSuggestion(pendingSuggestion(), { type: "accept" });
    const error = domainFailure(() => reviewSuggestion(accepted, { type: "reject" }));
    expect(error.code).toBe("invalid_transition");
  });
});
