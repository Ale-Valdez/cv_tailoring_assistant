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

describe("Fase 6.2 - el modelo propone el orden de bullets", () => {
  const experienceId = "22222222-2222-4222-8222-222222222222";
  const reactId = "33333333-3333-4333-8333-333333333331";
  const nodeId = "33333333-3333-4333-8333-333333333332";
  const projectId = "55555555-5555-4555-8555-555555555555";
  const calcId = "66666666-6666-4666-8666-666666666661";
  const boardId = "66666666-6666-4666-8666-666666666662";
  const react = "Mantuve la interfaz en React.";
  const node = "Diseñé el esquema en PostgreSQL.";
  const calc = "Modelé el cálculo.";
  const board = "Publiqué el tablero.";

  function orderInput(): TailoringProposalInput {
    const profile = confirmProfile(
      parseProfile({
        id: "11111111-1111-4111-8111-111111111111",
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: "Desarrolla servicios.",
        language: "es",
        experiences: [
          {
            id: experienceId,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [
              { id: reactId, text: react },
              { id: nodeId, text: node },
            ],
          },
        ],
        education: [],
        skills: [],
        projects: [
          {
            id: projectId,
            name: "Motor analítico",
            description: null,
            url: null,
            bullets: [
              { id: calcId, text: calc },
              { id: boardId, text: board },
            ],
          },
        ],
      }),
    );
    const job = parseJobPosting({
      id: "12121212-1212-4121-8121-121212121212",
      rawText: "Hace falta PostgreSQL. React es deseable.",
      title: "Full stack",
      company: null,
      language: "es",
      contentHash: "abc",
      requirements: [],
      keywords: [],
    });
    return { profile: profileForModel(profile), job, match: matchProfileToJob(profile, job) };
  }

  function flatOrder(ownerType: "experience" | "project", ownerId: string, after: string, evidenceId: string) {
    return {
      targetType: "bullet_order",
      bulletId: null,
      ownerType,
      ownerId,
      after,
      reason: "Sube lo que la oferta pide.",
      evidence: [{ type: "bullet", id: evidenceId }],
    };
  }

  it("traduce el formato plano de un empleo y de un proyecto", async () => {
    const proposal = await runProposeTailoringGraph(orderInput(), {
      async structure() {
        return {
          suggestions: [
            flatOrder("experience", experienceId, `${node}\n${react}`, reactId),
            flatOrder("project", projectId, `${board}\n${calc}`, calcId),
          ],
        };
      },
    });

    expect(proposal.map((item) => item.target)).toEqual([
      { type: "bullet_order", owner: { type: "experience", experienceId } },
      { type: "bullet_order", owner: { type: "project", projectId } },
    ]);
  });

  it("se queda con una sola sugerencia por bloque", async () => {
    const proposal = await runProposeTailoringGraph(orderInput(), {
      async structure() {
        return {
          suggestions: [
            flatOrder("experience", experienceId, `${node}\n${react}`, reactId),
            flatOrder("experience", experienceId, `${react}\n${node}`, nodeId),
          ],
        };
      },
    });

    expect(proposal).toHaveLength(1);
    expect(proposal[0]?.after).toBe(`${node}\n${react}`);
  });

  it("rechaza un orden que reescribe un bullet y acepta la lista corregida", async () => {
    const feedback: Array<string | null> = [];
    const proposal = await runProposeTailoringGraph(orderInput(), {
      async structure(call) {
        feedback.push(call.feedback);
        if (feedback.length === 1) {
          return {
            suggestions: [flatOrder("experience", experienceId, `${react}\nDiseñé el esquema en Kubernetes.`, reactId)],
          };
        }
        return { suggestions: [flatOrder("experience", experienceId, `${node}\n${react}`, reactId)] };
      },
    });

    expect(feedback[1]).toContain("Kubernetes");
    expect(proposal).toHaveLength(1);
    expect(proposal[0]?.after).toBe(`${node}\n${react}`);
  });
});
