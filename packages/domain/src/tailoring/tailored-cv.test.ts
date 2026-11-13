import { describe, expect, it } from "vitest";

import { DomainError } from "../errors.ts";
import { sampleConfirmedProfile, sampleDraftProfile, sampleIds } from "../profile/sample-profile.ts";
import { parseMatchResult } from "./match-result.ts";
import { parseSuggestion } from "./suggestion.ts";
import { parseTailoredCv, tailoredCvStatusFor } from "./tailored-cv.ts";

const tailoredCvId = "abababab-abab-4aba-8aba-abababababab";
const jobPostingId = "12121212-1212-4121-8121-121212121212";
const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const matchId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const requirementId = "13131313-1313-4131-8131-131313131313";
const exportId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const missingBulletId = "99999999-9999-4999-8999-999999999999";

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

function tailoredInput(snapshot: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: tailoredCvId,
    profileId: sampleIds.profile,
    jobPostingId,
    status: "draft",
    snapshot,
    suggestions: [
      {
        id: suggestionId,
        target: { type: "bullet", bulletId: sampleIds.bullet },
        before: "Mantuve APIs en TypeScript.",
        after: "Mantuve APIs en TypeScript para el servicio.",
        reason: "Aclara el alcance sin agregar herramientas.",
        evidence: [{ type: "bullet", bulletId: sampleIds.bullet }],
        status: "pending",
        validation: { outcome: "not_checked" },
      },
    ],
    matchResults: [
      {
        id: matchId,
        requirementId,
        status: "covered",
        evidenceBulletIds: [sampleIds.bullet],
        note: null,
      },
    ],
    exports: [
      {
        id: exportId,
        createdAt: "2026-11-13T12:00:00.000Z",
        version: 1,
        storageKey: "exports/cv-1.pdf",
      },
    ],
    ...overrides,
  };
}

describe("parseTailoredCv", () => {
  it("acepta un perfil confirmado y evidencia que existe", () => {
    const cv = parseTailoredCv(tailoredInput(sampleConfirmedProfile()));
    expect(cv.snapshot.status).toBe("confirmed");
    expect(cv.suggestions).toHaveLength(1);
    expect(cv.exports[0]?.version).toBe(1);
  });

  it("rechaza un perfil que todavía no está confirmado", () => {
    const error = domainFailure(() => parseTailoredCv(tailoredInput(sampleDraftProfile())));
    expect(error.message).toContain("perfil maestro confirmado");
  });

  it("rechaza evidencia que no está en la instantánea", () => {
    const error = domainFailure(() =>
      parseTailoredCv(
        tailoredInput(sampleConfirmedProfile(), {
          suggestions: [
            {
              id: suggestionId,
              target: { type: "summary" },
              before: "",
              after: "Texto",
              reason: "Motivo",
              evidence: [{ type: "bullet", bulletId: missingBulletId }],
              status: "pending",
              validation: { outcome: "not_checked" },
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("evidencia que no está en el perfil");
  });

  it("rechaza un perfil distinto al de la instantánea", () => {
    const error = domainFailure(() =>
      parseTailoredCv(
        tailoredInput(sampleConfirmedProfile(), {
          profileId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        }),
      ),
    );
    expect(error.message).toContain("no coincide");
  });
});

describe("tailoredCvStatusFor", () => {
  it("pasa a final cuando no quedan sugerencias pendientes", () => {
    const pending = parseTailoredCv(tailoredInput(sampleConfirmedProfile())).suggestions[0];
    if (pending === undefined) {
      throw new Error("Falta la sugerencia de ejemplo.");
    }
    expect(tailoredCvStatusFor([])).toBe("draft");
    expect(tailoredCvStatusFor([pending])).toBe("in_review");
    expect(tailoredCvStatusFor([parseSuggestion({ ...pending, status: "accepted" })])).toBe("final");
  });
});

describe("parseMatchResult", () => {
  it("exige evidencia cuando el requisito está cubierto", () => {
    const error = domainFailure(() =>
      parseMatchResult({
        id: matchId,
        requirementId,
        status: "covered",
        evidenceBulletIds: [],
        note: null,
      }),
    );
    expect(error.message).toContain("al menos un bullet");
  });

  it("permite una brecha sin bullets", () => {
    const match = parseMatchResult({
      id: matchId,
      requirementId,
      status: "gap",
      evidenceBulletIds: [],
      note: "No aparece en el perfil.",
    });
    expect(match.status).toBe("gap");
  });
});
