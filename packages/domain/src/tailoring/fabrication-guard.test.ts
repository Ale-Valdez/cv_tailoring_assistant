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

// Fase 4.4 del plan de auditoría (docs/07-plan-auditoria-matching.md): la frase
// de una categoría entra en el texto nuevo solo si un bullet citado tiene la
// evidencia de esa fila. Otro producto, una cifra, una empresa o una fecha
// siguen sin entrar. Una habilidad sin bullet no alcanza.
describe("Fase 4.4 - el fabrication guard y el término de la categoría", () => {
  const experienceId = "34444444-2222-4222-8222-222222222222";
  const projectId = "34444444-2222-4222-8222-222222222223";
  const fillerId = "34444444-3333-4333-8333-333333333330";

  function modelWith(input: {
    bullets?: Array<{ id: string; text: string }>;
    projectBullets?: Array<{ id: string; text: string }>;
    skills?: Array<{ id: string; name: string }>;
  }) {
    return profileForModel(
      confirmProfile(
        parseProfile({
          id: "34444444-1111-4111-8111-111111111111",
          status: "needs_review",
          contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
          summary: null,
          language: "es",
          experiences: [
            {
              id: experienceId,
              organization: "Analytical Engines",
              role: "Desarrolladora",
              span: { start: "2020-01", end: null, ongoing: true },
              location: null,
              bullets: input.bullets ?? [{ id: fillerId, text: "Mantuve el servicio en producción." }],
            },
          ],
          education: [],
          skills: (input.skills ?? []).map((skill) => ({ ...skill, source: "declared_by_user" as const })),
          projects:
            input.projectBullets === undefined
              ? []
              : [{ id: projectId, name: "avilab", description: null, url: null, bullets: input.projectBullets }],
        }),
      ),
    );
  }

  function rewrite(bulletId: string, after: string, evidenceIds: string[] = [bulletId]) {
    return draft({
      target: { type: "bullet", bulletId },
      after,
      evidence: evidenceIds.map((id) => ({ type: "bullet", bulletId: id })),
    });
  }

  it("Qdrant en el bullet citado permite escribir «base de datos vectorial»", () => {
    const bulletId = "34444444-3333-4333-8333-333333333331";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      job(),
      rewrite(bulletId, "Indexé embeddings en una base de datos vectorial con Qdrant."),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("Qdrant en el bullet citado permite el plural «bases de datos vectoriales»", () => {
    const bulletId = "34444444-3333-4333-8333-333333333332";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      job(),
      rewrite(bulletId, "Indexé embeddings en bases de datos vectoriales con Qdrant."),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("colas de Redis en el bullet citado permiten «procesamiento asíncrono»", () => {
    const bulletId = "34444444-3333-4333-8333-333333333333";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Procesé eventos con colas de Redis." }] }),
      job(),
      rewrite(bulletId, "Procesé eventos con colas de Redis, con procesamiento asíncrono."),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("Celery en un bullet de proyecto citado permite «procesamiento asíncrono»", () => {
    const bulletId = "34444444-3333-4333-8333-333333333334";
    const result = checkFabrication(
      modelWith({ projectBullets: [{ id: bulletId, text: "Envié tareas con Celery." }] }),
      job(),
      rewrite(bulletId, "Envié tareas con Celery, con procesamiento asíncrono."),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("cita el bullet de Qdrant aunque reescriba otro bullet", () => {
    const qdrantId = "34444444-3333-4333-8333-333333333335";
    const result = checkFabrication(
      modelWith({
        bullets: [
          { id: fillerId, text: "Mantuve el servicio en producción." },
          { id: qdrantId, text: "Indexé embeddings con Qdrant." },
        ],
      }),
      job(),
      rewrite(fillerId, "Mantuve el servicio sobre una base de datos vectorial.", [fillerId, qdrantId]),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("Qdrant solo en habilidades no permite la frase", () => {
    const result = checkFabrication(
      modelWith({ skills: [{ id: "34444444-3333-4333-8333-333333333336", name: "Qdrant" }] }),
      job(),
      draft({
        target: { type: "bullet", bulletId: fillerId },
        after: "Mantuve una base de datos vectorial.",
        evidence: [
          { type: "bullet", bulletId: fillerId },
          { type: "skill", skillId: "34444444-3333-4333-8333-333333333336" },
        ],
      }),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «base de datos vectorial», que no está en el perfil.");
  });

  it("Qdrant en un bullet que no se cita no permite la frase", () => {
    const qdrantId = "34444444-3333-4333-8333-333333333337";
    const result = checkFabrication(
      modelWith({
        bullets: [
          { id: fillerId, text: "Mantuve el servicio en producción." },
          { id: qdrantId, text: "Indexé embeddings con Qdrant." },
        ],
      }),
      job(),
      rewrite(fillerId, "Mantuve una base de datos vectorial."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «base de datos vectorial», que no está en el perfil.");
  });

  it("Redis como caché, sin colas ni Celery, no permite «procesamiento asíncrono»", () => {
    const bulletId = "34444444-3333-4333-8333-333333333338";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Usé Redis como caché." }] }),
      job(),
      rewrite(bulletId, "Usé Redis como caché para el procesamiento asíncrono."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «procesamiento asíncrono», que no está en el perfil.");
  });

  it("Qdrant no permite escribir Pinecone", () => {
    const bulletId = "34444444-3333-4333-8333-333333333339";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      job(),
      rewrite(bulletId, "Indexé embeddings en una base de datos vectorial con Pinecone."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «Pinecone», que no está en el perfil.");
    expect(invalidReasons(result).join(" ")).not.toContain("base de datos vectorial");
  });

  it("colas de Redis no permiten escribir RabbitMQ", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333a";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Procesé eventos con colas de Redis." }] }),
      job(),
      rewrite(bulletId, "Procesé eventos con colas de Redis y RabbitMQ."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «RabbitMQ», que no está en el perfil.");
  });

  it("Celery no permite escribir SQS", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333b";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Envié tareas con Celery." }] }),
      job(),
      rewrite(bulletId, "Envié tareas con Celery y SQS."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «SQS», que no está en el perfil.");
  });

  it("React no permite escribir Next.js", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333c";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Construí interfaces con React." }] }),
      job(),
      rewrite(bulletId, "Construí interfaces con Next.js."),
    );
    expect(invalidReasons(result).join(" ")).toContain("Next.js");
  });

  it("Django no permite escribir Prisma", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333d";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Desarrollé el backend con Django." }] }),
      job(),
      rewrite(bulletId, "Desarrollé el backend con Prisma."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «Prisma», que no está en el perfil.");
  });

  it("modelos de OpenAI no permiten escribir Anthropic", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333e";
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Integré modelos de OpenAI." }] }),
      job(),
      rewrite(bulletId, "Integré modelos de Anthropic."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «Anthropic», que no está en el perfil.");
  });

  it("FastAPI no permite escribir microservicios", () => {
    const bulletId = "34444444-3333-4333-8333-33333333333f";
    const posting = job({
      keywords: [
        {
          id: "34444444-6666-4666-8666-666666666661",
          canonical: "microservicios",
          aliases: [],
          frequency: 1,
          origin: "requisitos",
        },
      ],
    });
    const result = checkFabrication(
      modelWith({ bullets: [{ id: bulletId, text: "Implementé el orquestador en FastAPI." }] }),
      posting,
      rewrite(bulletId, "Implementé microservicios en FastAPI."),
    );
    expect(invalidReasons(result)).toContain("El texto introduce «microservicios», que no está en el perfil.");
  });

  it("la frase de la categoría no autoriza una cifra, una empresa ni una fecha nuevas", () => {
    const bulletId = "34444444-3333-4333-8333-333333333340";
    const model = modelWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] });
    const number = checkFabrication(model, job(), rewrite(bulletId, "Indexé 3 bases de datos vectoriales con Qdrant."));
    expect(invalidReasons(number)).toContain("El texto introduce «3», que no está en el perfil.");

    const company = checkFabrication(
      model,
      job(),
      rewrite(bulletId, "Indexé en Google una base de datos vectorial con Qdrant."),
    );
    expect(invalidReasons(company)).toContain("El texto introduce «Google», que no está en el perfil.");

    const date = checkFabrication(
      model,
      job(),
      rewrite(bulletId, "Desde 2024 indexé una base de datos vectorial con Qdrant."),
    );
    expect(invalidReasons(date)).toContain("El texto introduce «2024», que no está en el perfil.");
  });
});

// Fase 6.1 del plan de auditoría: un bullet_order reordena los textos de un
// empleo o de un proyecto. La lista es la misma. No reescribe, y no pasa por
// el control de términos nuevos.
describe("Fase 6.1 - orden de bullets", () => {
  const experienceId = "71111111-1111-4111-8111-111111111111";
  const reactId = "71111111-2222-4222-8222-222222222221";
  const nodeId = "71111111-2222-4222-8222-222222222222";
  const projectId = "71111111-3333-4333-8333-333333333333";
  const calcId = "71111111-4444-4444-8444-444444444441";
  const boardId = "71111111-4444-4444-8444-444444444442";
  const otherExperienceId = "71111111-5555-4555-8555-555555555555";
  const otherBulletId = "71111111-6666-4666-8666-666666666661";
  const react = "Mantuve la interfaz en React.";
  const node = "Diseñé el esquema en PostgreSQL.";
  const calc = "Modelé el cálculo.";
  const board = "Publiqué el tablero.";

  function orderProfile(input?: {
    experienceBullets?: Array<{ id: string; text: string }>;
    projectBullets?: Array<{ id: string; text: string }>;
  }) {
    const experienceBullets = input?.experienceBullets ?? [
      { id: reactId, text: react },
      { id: nodeId, text: node },
    ];
    const projectBullets = input?.projectBullets ?? [
      { id: calcId, text: calc },
      { id: boardId, text: board },
    ];
    return profileForModel(
      confirmProfile(
        parseProfile({
          id: "71111111-0000-4000-8000-000000000001",
          status: "needs_review",
          contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
          summary: null,
          language: "es",
          experiences: [
            {
              id: experienceId,
              organization: "Analytical Engines",
              role: "Desarrolladora",
              span: { start: "2020-01", end: null, ongoing: true },
              location: null,
              bullets: experienceBullets,
            },
            {
              id: otherExperienceId,
              organization: "Otra",
              role: "Pasante",
              span: { start: "2018-01", end: "2019-12", ongoing: false },
              location: null,
              bullets: [{ id: otherBulletId, text: "Archivé documentos." }],
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
              bullets: projectBullets,
            },
          ],
        }),
      ),
    );
  }

  function order(input: {
    owner: { type: "experience"; experienceId: string } | { type: "project"; projectId: string };
    after: string;
    evidence?: unknown;
  }) {
    const bulletId = input.owner.type === "experience" ? reactId : calcId;
    return draft({
      target: { type: "bullet_order", owner: input.owner },
      after: input.after,
      evidence: input.evidence ?? [{ type: "bullet", bulletId }],
    });
  }

  it("reordena los bullets de un empleo y pliega mayúsculas", () => {
    const result = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "experience", experienceId },
        after: `diseñé el esquema en postgresql.\n${react}`,
      }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("reordena los bullets de un proyecto", () => {
    const result = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "project", projectId },
        after: `${board}\n${calc}`,
      }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("acepta el mismo orden", () => {
    const result = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "experience", experienceId },
        after: `${react}\n${node}`,
      }),
    );
    expect(result).toEqual({ outcome: "valid" });
  });

  it("rechaza un texto que no es un bullet de ese bloque", () => {
    const result = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "experience", experienceId },
        after: `${react}\nDiseñé el esquema en Kubernetes.`,
      }),
    );
    const reasons = invalidReasons(result).join(" ");
    expect(reasons).toContain("Kubernetes");
    expect(reasons).toContain(node);
    expect(reasons).not.toContain("introduce");
  });

  it("rechaza una lista incompleta o con un bullet repetido", () => {
    const missing = checkFabrication(
      orderProfile(),
      job(),
      order({ owner: { type: "experience", experienceId }, after: react }),
    );
    expect(invalidReasons(missing).join(" ")).toContain(node);

    const repeated = checkFabrication(
      orderProfile(),
      job(),
      order({ owner: { type: "experience", experienceId }, after: `${react}\n${node}\n${react}` }),
    );
    expect(invalidReasons(repeated).join(" ")).toContain("repetido");
  });

  it("rechaza dos bullets que pliegan igual", () => {
    const result = checkFabrication(
      orderProfile({
        experienceBullets: [
          { id: reactId, text: "Usé React." },
          { id: nodeId, text: "Usé React" },
        ],
      }),
      job(),
      order({ owner: { type: "experience", experienceId }, after: "Usé React.\nUsé React" }),
    );
    expect(invalidReasons(result)).toContain("Dos bullets de ese empleo dicen lo mismo y no se pueden reordenar.");
  });

  it("no reordena un bloque con menos de dos bullets", () => {
    const single = checkFabrication(
      orderProfile({ experienceBullets: [{ id: reactId, text: react }] }),
      job(),
      order({ owner: { type: "experience", experienceId }, after: react }),
    );
    expect(invalidReasons(single)).toContain("No hay bullets para reordenar.");

    const empty = checkFabrication(
      orderProfile({ projectBullets: [] }),
      job(),
      order({
        owner: { type: "project", projectId },
        after: board,
        evidence: [{ type: "bullet", bulletId: reactId }],
      }),
    );
    expect(invalidReasons(empty)).toContain("No hay bullets para reordenar.");
  });

  it("exige un bullet de ese bloque como evidencia", () => {
    const other = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "experience", experienceId },
        after: `${node}\n${react}`,
        evidence: [{ type: "bullet", bulletId: otherBulletId }],
      }),
    );
    expect(invalidReasons(other)).toContain("La sugerencia de orden tiene que citar un bullet de ese empleo.");

    const skill = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "project", projectId },
        after: `${board}\n${calc}`,
        evidence: [{ type: "skill", skillId: sampleIds.skill }],
      }),
    );
    expect(invalidReasons(skill).join(" ")).toContain("proyecto");
  });

  it("rechaza un empleo o un proyecto que no está en el perfil", () => {
    const missingExperience = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "experience", experienceId: "71111111-7777-4777-8777-777777777777" },
        after: `${node}\n${react}`,
      }),
    );
    expect(invalidReasons(missingExperience)).toContain("La sugerencia apunta a un empleo que no está en el perfil.");

    const missingProject = checkFabrication(
      orderProfile(),
      job(),
      order({
        owner: { type: "project", projectId: "71111111-8888-4888-8888-888888888888" },
        after: `${board}\n${calc}`,
      }),
    );
    expect(invalidReasons(missingProject)).toContain("La sugerencia apunta a un proyecto que no está en el perfil.");
  });

  it("rechaza un bullet que ocupa más de una línea", () => {
    const result = checkFabrication(
      orderProfile({
        experienceBullets: [
          { id: reactId, text: "Mantuve la interfaz\nen React." },
          { id: nodeId, text: node },
        ],
      }),
      job(),
      order({
        owner: { type: "experience", experienceId },
        after: `Mantuve la interfaz\nen React.\n${node}`,
      }),
    );
    expect(invalidReasons(result)).toContain("Un bullet de ese empleo ocupa más de una línea.");
  });
});
