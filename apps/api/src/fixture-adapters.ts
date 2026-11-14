import type { JobAnalyzer, ProfileExtractor, TailoringProposer } from "@cv-tailor/application";

export const FIXTURE_BULLET = "Mantuve APIs en TypeScript.";
export const FIXTURE_REWRITE = "Mantuve APIs en TypeScript para el servicio.";
export const FIXTURE_REASON = "Nombra el servicio sin agregar herramientas.";
export const FIXTURE_JOB_TITLE = "Backend";
export const FIXTURE_REQUIREMENT = "Experiencia con TypeScript";

export function createFixtureProfileExtractor(): ProfileExtractor {
  return {
    async extract() {
      return {
        summary: "Desarrolla servicios con TypeScript.",
        language: "es",
        experiences: [
          {
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [FIXTURE_BULLET],
          },
        ],
        education: [],
        skills: [{ name: "TypeScript" }],
        projects: [],
      };
    },
  };
}

export function createFixtureJobAnalyzer(): JobAnalyzer {
  return {
    async analyze() {
      return {
        title: FIXTURE_JOB_TITLE,
        company: "Analytical Engines",
        language: "es",
        requirements: [
          {
            text: FIXTURE_REQUIREMENT,
            kind: "technical",
            priority: "required",
          },
        ],
        keywords: [{ canonical: "TypeScript", aliases: [], frequency: 1, origin: "requisitos" }],
      };
    },
  };
}

export function createFixtureTailoringProposer(): TailoringProposer {
  return {
    async propose(input) {
      const bullet = input.profile.experiences[0]?.bullets[0];
      if (bullet === undefined) {
        return [];
      }
      return [
        {
          target: { type: "bullet", bulletId: bullet.id },
          after: FIXTURE_REWRITE,
          reason: FIXTURE_REASON,
          evidence: [{ type: "bullet", bulletId: bullet.id }],
        },
      ];
    },
  };
}
