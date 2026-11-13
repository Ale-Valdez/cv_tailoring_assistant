import { ApplicationError, type TailoringProposalInput } from "@cv-tailor/application";
import {
  confirmProfile,
  matchProfileToJob,
  parseJobPosting,
  parseProfile,
  profileForModel,
  type JobPosting,
} from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { PROPOSE_TAILORING_MAX_ATTEMPTS, runProposeTailoringGraph } from "./graph.ts";

const bulletId = "33333333-3333-4333-8333-333333333333";

function input(): TailoringProposalInput {
  const profile = confirmProfile(
    parseProfile({
      id: "11111111-1111-4111-8111-111111111111",
      status: "needs_review",
      contact: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: null,
        location: null,
        links: [],
      },
      summary: "Desarrolla servicios con TypeScript.",
      language: "es",
      experiences: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [{ id: bulletId, text: "Mantuve APIs en TypeScript." }],
        },
      ],
      education: [],
      skills: [],
      projects: [],
    }),
  );
  const job: JobPosting = parseJobPosting({
    id: "12121212-1212-4121-8121-121212121212",
    rawText: "Buscamos TypeScript.",
    title: "Backend",
    company: null,
    language: "es",
    contentHash: "abc",
    requirements: [],
    keywords: [
      {
        id: "19191919-1919-4191-8191-191919191919",
        canonical: "Kubernetes",
        aliases: [],
        frequency: 1,
        origin: "requisitos",
      },
    ],
  });
  return { profile: profileForModel(profile), job, match: matchProfileToJob(profile, job) };
}

function bullet(after: string) {
  return {
    target: { type: "bullet", bulletId },
    after,
    reason: "Acerca el bullet a la oferta.",
    evidence: [{ type: "bullet", bulletId }],
  };
}

describe("runProposeTailoringGraph", () => {
  it("acepta el formato plano que devuelve el modelo", async () => {
    const proposal = await runProposeTailoringGraph(input(), {
      async structure() {
        return {
          suggestions: [
            {
              targetType: "bullet",
              bulletId,
              after: "Mantuve las APIs del servicio en TypeScript.",
              reason: "Nombra el servicio sin agregar herramientas.",
              evidence: [{ type: "bullet", id: bulletId }],
            },
          ],
        };
      },
    });

    expect(proposal).toHaveLength(1);
    expect(proposal[0]?.target).toEqual({ type: "bullet", bulletId });
  });

  it("reintenta la sugerencia inválida y conserva la que el guard acepta", async () => {
    const feedback: Array<string | null> = [];
    const proposal = await runProposeTailoringGraph(input(), {
      async structure(call) {
        feedback.push(call.feedback);
        if (feedback.length === 1) {
          return {
            suggestions: [
              bullet("Mantuve las APIs del servicio en TypeScript."),
              {
                target: { type: "summary" },
                after: "Desarrolla servicios con TypeScript y Kubernetes.",
                reason: "Incorpora una herramienta de la oferta.",
                evidence: [{ type: "summary" }],
              },
            ],
          };
        }
        return {
          suggestions: [
            {
              target: { type: "summary" },
              after: "Desarrolla servicios con TypeScript.",
              reason: "El resumen ya nombra TypeScript.",
              evidence: [{ type: "summary" }],
            },
          ],
        };
      },
    });

    expect(feedback).toHaveLength(2);
    expect(feedback[1]).toContain("Kubernetes");
    expect(proposal.map((item) => item.target.type)).toEqual(["bullet", "summary"]);
    expect(proposal[1]?.after).toBe("Desarrolla servicios con TypeScript.");
  });

  it("descarta lo que sigue inválido al agotar los intentos", async () => {
    let calls = 0;
    const proposal = await runProposeTailoringGraph(input(), {
      async structure() {
        calls += 1;
        return { suggestions: [bullet("Mantuve APIs en Kubernetes.")] };
      },
    });

    expect(calls).toBe(PROPOSE_TAILORING_MAX_ATTEMPTS);
    expect(proposal).toEqual([]);
  });

  it("se detiene si el modelo no llega a devolver un esquema válido", async () => {
    let calls = 0;
    const error = await runProposeTailoringGraph(input(), {
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

    expect(calls).toBe(PROPOSE_TAILORING_MAX_ATTEMPTS);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ code: "proposal_failed", message: "No se pudieron proponer cambios." });
    if (error instanceof ApplicationError) {
      expect(error.message).not.toContain("salida inválida");
    }
  });
});
