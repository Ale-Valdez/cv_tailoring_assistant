import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseJobPosting, type JobPosting } from "../job/job-posting.ts";
import { confirmProfile, parseProfile, profileForModel, type ProfileForModel } from "../profile/profile.ts";
import { sampleConfirmedProfile, sampleIds } from "../profile/sample-profile.ts";
import { checkFabrication, type FabricationDraft } from "./fabrication-guard.ts";
import { evidenceRefSchema, suggestionTargetSchema, type SuggestionValidation } from "./suggestion.ts";

const skillDocker = "45454545-4545-4454-8454-454545454545";

function job(overrides: Record<string, unknown> = {}): JobPosting {
  return parseJobPosting({
    id: "12121212-1212-4121-8121-121212121212",
    rawText: "Buscamos TypeScript.",
    title: "Backend",
    company: "Ejemplo",
    language: "es",
    contentHash: "abc",
    requirements: [],
    keywords: [
      {
        id: "19191919-1919-4191-8191-191919191919",
        canonical: "TypeScript",
        aliases: ["TS"],
        frequency: 1,
        origin: "requisitos",
      },
      {
        id: "23232323-2323-4232-8232-232323232323",
        canonical: "Kubernetes",
        aliases: ["K8s"],
        frequency: 1,
        origin: "requisitos",
      },
    ],
    ...overrides,
  });
}

function draft(overrides: Record<string, unknown> = {}): FabricationDraft {
  const value = {
    target: { type: "bullet", bulletId: sampleIds.bullet },
    after: "Mantuve las APIs del servicio en TypeScript.",
    evidence: [{ type: "bullet", bulletId: sampleIds.bullet }],
    ...overrides,
  };
  return {
    target: suggestionTargetSchema.parse(value.target),
    after: typeof value.after === "string" ? value.after : "",
    evidence: z.array(evidenceRefSchema).parse(value.evidence),
  };
}

function invalidReasons(result: SuggestionValidation): string[] {
  if (result.outcome !== "invalid") {
    throw new Error(`Se esperaba una sugerencia inválida y fue ${result.outcome}.`);
  }
  return result.reasons;
}

function profile(): ProfileForModel {
  return profileForModel(sampleConfirmedProfile());
}

describe("checkFabrication", () => {
  it("permite reformular un bullet con términos que el perfil ya tiene", () => {
    const result = checkFabrication(profile(), job(), draft());
    expect(result).toEqual({ outcome: "valid" });
  });

  it("permite un verbo nuevo al inicio y el alias de un término del perfil", () => {
    const result = checkFabrication(
      profile(),
      job(),
      draft({ after: "Sostuve las APIs en TS." }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("permite una cifra o una fecha que ya está en el perfil", () => {
    const result = checkFabrication(
      profile(),
      job(),
      draft({ after: "Desde 2020 mantuve APIs en TypeScript." }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("rechaza una herramienta, una cifra o una empresa que el perfil no respalda", () => {
    const posting = job({ rawText: "Buscamos TypeScript y experiencia en Google." });
    expect(checkFabrication(profile(), posting, draft({ after: "Mantuve APIs en TypeScript y Kubernetes." }))).toMatchObject({
      outcome: "invalid",
    });
    expect(
      invalidReasons(checkFabrication(profile(), posting, draft({ after: "Mantuve APIs en TypeScript y Kubernetes." }))),
    ).toContain("El texto introduce «Kubernetes», que no está en el perfil.");

    const number = checkFabrication(profile(), posting, draft({ after: "Mantuve 15 APIs en TypeScript." }));
    expect(invalidReasons(number)).toContain("El texto introduce «15», que no está en el perfil.");

    const company = checkFabrication(
      profile(),
      posting,
      draft({ after: "Google mantuvo las APIs en TypeScript." }),
    );
    expect(invalidReasons(company)).toContain("El texto introduce «Google», que no está en el perfil.");
  });

  it("no trata Java como alias de JavaScript ni deja pasar una keyword ausente", () => {
    const withJavascript = profileForModel(
      confirmProfile(
        parseProfile({
          ...sampleConfirmedProfile(),
          status: "needs_review",
          experiences: [
            {
              ...sampleConfirmedProfile().experiences[0],
              bullets: [{ id: sampleIds.bullet, text: "Mantuve APIs en JavaScript." }],
            },
          ],
        }),
      ),
    );
    const result = checkFabrication(
      withJavascript,
      job(),
      draft({ after: "Mantuve APIs en Java." }),
    );
    expect(invalidReasons(result).join(" ")).toContain("Java");
  });

  it("acepta el vocabulario de la oferta cuando el perfil tiene un alias, y una habilidad declarada", () => {
    const withPostgres = profileForModel(
      confirmProfile(
        parseProfile({
          ...sampleConfirmedProfile(),
          status: "needs_review",
          skills: [
            ...sampleConfirmedProfile().skills,
            { id: skillDocker, name: "Docker", source: "declared_by_user" },
          ],
          experiences: [
            {
              ...sampleConfirmedProfile().experiences[0],
              bullets: [{ id: sampleIds.bullet, text: "Usé Postgres en producción." }],
            },
          ],
        }),
      ),
    );
    const posting = job({
      keywords: [
        {
          id: "20202020-2020-4020-8020-202020202020",
          canonical: "PostgreSQL",
          aliases: ["PG"],
          frequency: 1,
          origin: "requisitos",
        },
      ],
    });
    expect(checkFabrication(withPostgres, posting, draft({ after: "Usé PostgreSQL en producción." })).outcome).toBe(
      "valid",
    );
    expect(checkFabrication(withPostgres, posting, draft({ after: "Usé PG en producción." })).outcome).toBe("valid");
    expect(
      checkFabrication(withPostgres, posting, draft({ after: "Usé Postgres y Docker en producción." })).outcome,
    ).toBe("valid");
  });

  it("exige citar el bullet reescrito y la evidencia existente", () => {
    const missing = checkFabrication(
      profile(),
      job(),
      draft({ evidence: [{ type: "summary" }] }),
    );
    expect(invalidReasons(missing)).toContain("La sugerencia tiene que citar el bullet que reescribe.");

    const unknown = checkFabrication(
      profile(),
      job(),
      draft({
        target: { type: "bullet", bulletId: "99999999-9999-4999-8999-999999999999" },
        evidence: [{ type: "bullet", bulletId: "99999999-9999-4999-8999-999999999999" }],
      }),
    );
    expect(invalidReasons(unknown)).toContain("La sugerencia apunta a un bullet que no está en el perfil.");
  });

  it("solo permite reordenar las habilidades que ya están", () => {
    const withSkills = profileForModel(
      confirmProfile(
        parseProfile({
          ...sampleConfirmedProfile(),
          status: "needs_review",
          skills: [
            { id: sampleIds.skill, name: "TypeScript", source: "extracted_from_cv" },
            { id: skillDocker, name: "Docker", source: "declared_by_user" },
          ],
        }),
      ),
    );
    const reordered = checkFabrication(
      withSkills,
      job(),
      draft({
        target: { type: "skill_order" },
        after: "Docker\nTypeScript",
        evidence: [{ type: "skill", skillId: sampleIds.skill }],
      }),
    );
    expect(reordered).toEqual({ outcome: "valid" });

    const invented = checkFabrication(
      withSkills,
      job(),
      draft({
        target: { type: "skill_order" },
        after: "Docker\nKubernetes",
        evidence: [{ type: "skill", skillId: skillDocker }],
      }),
    );
    expect(invalidReasons(invented).join(" ")).toContain("Kubernetes");
    expect(invalidReasons(invented).join(" ")).toContain("TypeScript");
  });

  it("no marca como término nuevo el lenguaje de trámite de la oferta", () => {
    const result = checkFabrication(
      profile(),
      job(),
      draft({ after: "Buscamos mantener las APIs en TypeScript." }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });
});
