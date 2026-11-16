import { describe, expect, it } from "vitest";

import { parseJobPosting } from "../job/job-posting.ts";
import { confirmProfile, parseProfile } from "../profile/profile.ts";

import { matchProfileToJob } from "./match-profile.ts";

const profileId = "11111111-1111-4111-8111-111111111111";
const experienceId = "22222222-2222-4222-8222-222222222222";
const typescriptBullet = "33333333-3333-4333-8333-333333333333";
const postgresBullet = "34343434-3434-4434-8434-343434343434";
const skillId = "44444444-4444-4444-8444-444444444444";
const jobId = "12121212-1212-4121-8121-121212121212";
const typescriptRequirement = "13131313-1313-4131-8131-131313131313";
const kubernetesRequirement = "15151515-1515-4151-8151-151515151515";
const dockerRequirement = "16161616-1616-4161-8161-161616161616";
const javaRequirement = "17171717-1717-4171-8171-171717171717";
const vagueRequirement = "18181818-1818-4181-8181-181818181818";
const typescriptKeyword = "19191919-1919-4191-8191-191919191919";
const postgresKeyword = "20202020-2020-4020-8020-202020202020";
const dockerKeyword = "21212121-2121-4121-8121-212121212121";
const kubernetesKeyword = "23232323-2323-4232-8232-232323232323";
const javaKeyword = "24242424-2424-4242-8242-242424242424";

function profile(language = "es") {
  return confirmProfile(
    parseProfile({
      id: profileId,
      status: "needs_review",
      contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
      summary: "Desarrolla servicios.",
      language,
      experiences: [
        {
          id: experienceId,
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [
            { id: typescriptBullet, text: "Mantuve APIs en TypeScript y JavaScript." },
            { id: postgresBullet, text: "Usé Postgres en producción." },
          ],
        },
      ],
      education: [],
      skills: [{ id: skillId, name: "Docker", source: "declared_by_user" }],
      projects: [],
    }),
  );
}

function posting(language: string | null = "es") {
  return parseJobPosting({
    id: jobId,
    rawText: "Buscamos TypeScript, PostgreSQL, Docker, Kubernetes y Java.",
    title: "Backend",
    company: "Ejemplo",
    language,
    contentHash: "abc",
    requirements: [
      { id: typescriptRequirement, text: "Experiencia con TypeScript y PostgreSQL", kind: "technical", priority: "required" },
      { id: kubernetesRequirement, text: "Experiencia con TypeScript y Kubernetes", kind: "technical", priority: "required" },
      { id: dockerRequirement, text: "Experiencia con Docker", kind: "technical", priority: "preferred" },
      { id: javaRequirement, text: "Experiencia con Java", kind: "technical", priority: "required" },
      { id: vagueRequirement, text: "Experiencia y conocimientos", kind: "functional", priority: "preferred" },
    ],
    keywords: [
      { id: typescriptKeyword, canonical: "TypeScript", aliases: ["TS"], frequency: 2, origin: "requisitos" },
      { id: postgresKeyword, canonical: "PostgreSQL", aliases: [], frequency: 1, origin: "requisitos" },
      { id: dockerKeyword, canonical: "Docker", aliases: [], frequency: 1, origin: "requisitos" },
      { id: kubernetesKeyword, canonical: "Kubernetes", aliases: ["K8s"], frequency: 1, origin: "requisitos" },
      { id: javaKeyword, canonical: "Java", aliases: [], frequency: 1, origin: "requisitos" },
    ],
  });
}

describe("matchProfileToJob", () => {
  it("marca cubierto, parcial y brecha, y no confunde Java con JavaScript", () => {
    const report = matchProfileToJob(profile(), posting());

    expect(report.matchResults.map((item) => ({ requirementId: item.requirementId, status: item.status, evidenceBulletIds: item.evidenceBulletIds, note: item.note }))).toEqual([
      {
        requirementId: typescriptRequirement,
        status: "covered",
        evidenceBulletIds: [typescriptBullet, postgresBullet],
        note: null,
      },
      {
        requirementId: kubernetesRequirement,
        status: "partial",
        evidenceBulletIds: [typescriptBullet],
        note: "Falta evidencia en bullets de: Kubernetes.",
      },
      {
        requirementId: dockerRequirement,
        status: "gap",
        evidenceBulletIds: [],
        note: "La habilidad «Docker» está en el perfil, sin un bullet que la respalde.",
      },
      {
        requirementId: javaRequirement,
        status: "gap",
        evidenceBulletIds: [],
        note: "Sin evidencia en el perfil.",
      },
      {
        requirementId: vagueRequirement,
        status: "gap",
        evidenceBulletIds: [],
        note: "El requisito no tiene términos comparables.",
      },
    ]);
    expect(report.keywords.map((item) => ({ canonical: item.canonical, present: item.present, evidenceBulletIds: item.evidenceBulletIds, skillNames: item.skillNames }))).toEqual([
      { canonical: "TypeScript", present: true, evidenceBulletIds: [typescriptBullet], skillNames: [] },
      { canonical: "PostgreSQL", present: true, evidenceBulletIds: [postgresBullet], skillNames: [] },
      { canonical: "Docker", present: true, evidenceBulletIds: [], skillNames: ["Docker"] },
      { canonical: "Kubernetes", present: false, evidenceBulletIds: [], skillNames: [] },
      { canonical: "Java", present: false, evidenceBulletIds: [], skillNames: [] },
    ]);
    expect(report.citedBullets.map((item) => item.bulletId)).toEqual([typescriptBullet, postgresBullet]);
    expect(report.languageNotice).toBeNull();
  });

  it("avisa cuando la oferta y el perfil están en idiomas distintos, sin traducir", () => {
    const report = matchProfileToJob(profile("español"), posting("en"));

    expect(report.languageNotice).toBe(
      "La oferta está en inglés y el perfil en español. El informe compara términos sin traducir.",
    );
    expect(report.matchResults[0]?.status).toBe("covered");
  });
});

// Fase 2.1 del plan de auditoría (docs/07-plan-auditoria-matching.md): cobertura
// exacta y por alias de diccionario. Fija el comportamiento actual, no lo cambia.
describe("Fase 2.1 - cobertura exacta y por alias", () => {
  const profileId21 = "31111111-1111-4111-8111-111111111111";
  const experienceId21 = "31111111-2222-4222-8222-222222222222";
  const bulletId21 = "31111111-3333-4333-8333-333333333333";
  const jobId21 = "31111111-4444-4444-8444-444444444444";
  const requirementId21 = "31111111-5555-4555-8555-555555555555";

  function profileWithBullet(text: string) {
    return confirmProfile(
      parseProfile({
        id: profileId21,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId21,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId21, text }],
          },
        ],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  function postingForPostgres() {
    return parseJobPosting({
      id: jobId21,
      rawText: "Buscamos experiencia con PostgreSQL.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-1",
      requirements: [
        { id: requirementId21, text: "Experiencia con PostgreSQL", kind: "technical", priority: "required" },
      ],
      keywords: [],
    });
  }

  it("un bullet con el mismo término (PostgreSQL) cubre el requisito", () => {
    const report = matchProfileToJob(
      profileWithBullet("Administré bases de datos PostgreSQL en producción."),
      postingForPostgres(),
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId21]);
  });

  it("un bullet con el alias de diccionario (Postgres) también cubre el requisito", () => {
    const report = matchProfileToJob(
      profileWithBullet("Administré bases de datos Postgres en producción."),
      postingForPostgres(),
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId21]);
  });
});

// Fase 2.2 del plan de auditoría (docs/07-plan-auditoria-matching.md): cobertura
// parcial cuando el requisito pide varias tecnologías y el perfil solo acredita
// algunas. Fija el comportamiento actual, no lo cambia.
describe("Fase 2.2 - cobertura parcial", () => {
  const profileId22 = "32222222-1111-4111-8111-111111111111";
  const experienceId22 = "32222222-2222-4222-8222-222222222222";
  const bulletId22 = "32222222-3333-4333-8333-333333333333";
  const jobId22 = "32222222-4444-4444-8444-444444444444";

  function profileWithBullet(text: string) {
    return confirmProfile(
      parseProfile({
        id: profileId22,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId22,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId22, text }],
          },
        ],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  it("React en un bullet, sin Next.js, deja el requisito en partial", () => {
    const reactRequirement = "32222222-5555-4555-8555-555555555551";
    const reactKeyword = "32222222-6666-4666-8666-666666666661";
    const nextKeyword = "32222222-6666-4666-8666-666666666662";

    const job = parseJobPosting({
      id: jobId22,
      rawText: "Buscamos experiencia con React y Next.js.",
      title: "Frontend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-2-react",
      requirements: [
        { id: reactRequirement, text: "Experiencia con React y Next.js", kind: "technical", priority: "required" },
      ],
      keywords: [
        { id: reactKeyword, canonical: "React", aliases: [], frequency: 1, origin: "requisitos" },
        { id: nextKeyword, canonical: "Next.js", aliases: [], frequency: 1, origin: "requisitos" },
      ],
    });

    const report = matchProfileToJob(
      profileWithBullet("Construí interfaces de usuario con React."),
      job,
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId22]);
    expect(report.matchResults[0]?.note).toBe("Falta evidencia en bullets de: Next.js.");
  });

  it("PostgreSQL en un bullet, sin Prisma, TypeORM ni Sequelize, deja el requisito en partial", () => {
    const ormRequirement = "32222222-5555-4555-8555-555555555552";
    const postgresKeyword22 = "32222222-7777-4777-8777-777777777771";
    const mysqlKeyword22 = "32222222-7777-4777-8777-777777777772";
    const prismaKeyword22 = "32222222-7777-4777-8777-777777777773";
    const typeormKeyword22 = "32222222-7777-4777-8777-777777777774";
    const sequelizeKeyword22 = "32222222-7777-4777-8777-777777777775";

    const job = parseJobPosting({
      id: jobId22,
      rawText: "Buscamos experiencia con PostgreSQL, MySQL, Prisma, TypeORM y Sequelize.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-2-orm",
      requirements: [
        {
          id: ormRequirement,
          text: "Experiencia con PostgreSQL, MySQL, Prisma, TypeORM y Sequelize",
          kind: "technical",
          priority: "required",
        },
      ],
      keywords: [
        { id: postgresKeyword22, canonical: "PostgreSQL", aliases: [], frequency: 1, origin: "requisitos" },
        { id: mysqlKeyword22, canonical: "MySQL", aliases: [], frequency: 1, origin: "requisitos" },
        { id: prismaKeyword22, canonical: "Prisma", aliases: [], frequency: 1, origin: "requisitos" },
        { id: typeormKeyword22, canonical: "TypeORM", aliases: [], frequency: 1, origin: "requisitos" },
        { id: sequelizeKeyword22, canonical: "Sequelize", aliases: [], frequency: 1, origin: "requisitos" },
      ],
    });

    const report = matchProfileToJob(
      profileWithBullet("Diseñé modelos de datos y consultas en PostgreSQL."),
      job,
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId22]);
    expect(report.matchResults[0]?.note).toBe("Falta evidencia en bullets de: MySQL, Prisma, TypeORM y Sequelize.");
  });
});

// Fase 2.3 del plan de auditoría (docs/07-plan-auditoria-matching.md): brechas
// cuando el perfil solo tiene una tecnología de la misma categoría o una
// palabra parecida, sin el término exacto que pide el requisito. Fija el
// comportamiento de ese momento, no lo cambia. La categoría queda en partial
// en la Fase 4.1. El producto nombrado sigue en gap; la Fase 4.2 lo fija
// para el resto de parejas.
describe("Fase 2.3 - brechas por término no relacionado", () => {
  const profileId23 = "32333333-1111-4111-8111-111111111111";
  const experienceId23 = "32333333-2222-4222-8222-222222222222";
  const jobId23 = "32333333-4444-4444-8444-444444444444";

  function profileWithBullet(bulletId: string, text: string) {
    return confirmProfile(
      parseProfile({
        id: profileId23,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId23,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId, text }],
          },
        ],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  it("colas de Redis, sin RabbitMQ ni SQS, dejan el requisito en gap", () => {
    const bulletId = "32333333-3333-4333-8333-333333333331";
    const requirementId = "32333333-5555-4555-8555-555555555551";
    const rabbitmqKeyword = "32333333-6666-4666-8666-666666666661";
    const sqsKeyword = "32333333-6666-4666-8666-666666666662";

    const job = parseJobPosting({
      id: jobId23,
      rawText: "Buscamos experiencia con RabbitMQ o SQS.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-3-colas",
      requirements: [
        { id: requirementId, text: "Experiencia con RabbitMQ o SQS", kind: "technical", priority: "required" },
      ],
      keywords: [
        { id: rabbitmqKeyword, canonical: "RabbitMQ", aliases: [], frequency: 1, origin: "requisitos" },
        { id: sqsKeyword, canonical: "SQS", aliases: [], frequency: 1, origin: "requisitos" },
      ],
    });

    const report = matchProfileToJob(profileWithBullet(bulletId, "Procesé eventos con colas de Redis."), job);

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });

  it("JavaScript sin la palabra TypeScript deja el requisito en gap", () => {
    const bulletId = "32333333-3333-4333-8333-333333333332";
    const requirementId = "32333333-5555-4555-8555-555555555552";
    const typescriptKeyword23 = "32333333-6666-4666-8666-666666666663";

    const job = parseJobPosting({
      id: jobId23,
      rawText: "Buscamos experiencia con TypeScript.",
      title: "Frontend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-3-typescript",
      requirements: [
        { id: requirementId, text: "Experiencia con TypeScript", kind: "technical", priority: "required" },
      ],
      keywords: [{ id: typescriptKeyword23, canonical: "TypeScript", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    const report = matchProfileToJob(profileWithBullet(bulletId, "Desarrollé interfaces en JavaScript."), job);

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });

  it("Qdrant sin Pinecone deja el requisito en gap", () => {
    const bulletId = "32333333-3333-4333-8333-333333333333";
    const requirementId = "32333333-5555-4555-8555-555555555553";
    const pineconeKeyword = "32333333-6666-4666-8666-666666666664";

    const job = parseJobPosting({
      id: jobId23,
      rawText: "Buscamos experiencia con Pinecone.",
      title: "Backend IA",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-3-pinecone",
      requirements: [
        { id: requirementId, text: "Experiencia con Pinecone", kind: "technical", priority: "required" },
      ],
      keywords: [{ id: pineconeKeyword, canonical: "Pinecone", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    const report = matchProfileToJob(profileWithBullet(bulletId, "Indexé embeddings con Qdrant."), job);

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });

  it("JavaScript, pidiendo Java, deja el requisito en gap (no se confunden)", () => {
    const bulletId = "32333333-3333-4333-8333-333333333334";
    const requirementId = "32333333-5555-4555-8555-555555555554";
    const javaKeyword23 = "32333333-6666-4666-8666-666666666665";

    const job = parseJobPosting({
      id: jobId23,
      rawText: "Buscamos experiencia con Java.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-3-java",
      requirements: [{ id: requirementId, text: "Experiencia con Java", kind: "technical", priority: "required" }],
      keywords: [{ id: javaKeyword23, canonical: "Java", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    const report = matchProfileToJob(profileWithBullet(bulletId, "Mantuve APIs en JavaScript."), job);

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });
});

// Fase 2.4 del plan de auditoría (docs/07-plan-auditoria-matching.md): una
// habilidad declarada, sin un bullet que la respalde, no cubre el requisito.
// Fija el comportamiento actual, no lo cambia.
describe("Fase 2.4 - brecha por habilidad sin bullet", () => {
  const profileId24 = "32444444-1111-4111-8111-111111111111";
  const experienceId24 = "32444444-2222-4222-8222-222222222222";
  const bulletId24 = "32444444-3333-4333-8333-333333333333";
  const skillId24 = "32444444-3333-4333-8333-333333333334";
  const jobId24 = "32444444-4444-4444-8444-444444444444";
  const requirementId24 = "32444444-5555-4555-8555-555555555555";
  const jestKeyword24 = "32444444-6666-4666-8666-666666666666";

  it("Jest solo en habilidades, sin bullet, deja el requisito en gap con la nota de habilidad sin respaldo", () => {
    const profile = confirmProfile(
      parseProfile({
        id: profileId24,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId24,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId24, text: "Desarrollé interfaces en React y JavaScript." }],
          },
        ],
        education: [],
        skills: [{ id: skillId24, name: "Jest", source: "declared_by_user" }],
        projects: [],
      }),
    );

    const job = parseJobPosting({
      id: jobId24,
      rawText: "Buscamos experiencia con Jest.",
      title: "Frontend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-2-4-jest",
      requirements: [
        { id: requirementId24, text: "Experiencia con Jest", kind: "technical", priority: "required" },
      ],
      keywords: [{ id: jestKeyword24, canonical: "Jest", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    const report = matchProfileToJob(profile, job);

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe(
      "La habilidad «Jest» está en el perfil, sin un bullet que la respalde.",
    );
  });
});

// Fase 3 del plan de auditoría (docs/07-plan-auditoria-matching.md, ADR-027):
// la relación requisito-keyword guardada explícita en `keywordIds` vale como
// señal, aunque el texto del requisito no repita el término literal.
describe("Fase 3 - keywords explícitas por requisito", () => {
  const profileId3 = "33111111-1111-4111-8111-111111111111";
  const experienceId3 = "33111111-2222-4222-8222-222222222222";
  const bulletId3 = "33111111-3333-4333-8333-333333333333";
  const jobId3 = "33111111-4444-4444-8444-444444444444";
  const requirementId3 = "33111111-5555-4555-8555-555555555555";
  const keywordId3 = "33111111-6666-4666-8666-666666666666";

  function profileWithBullet(text: string) {
    return confirmProfile(
      parseProfile({
        id: profileId3,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId3,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId3, text }],
          },
        ],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  it("una keyword citada explícitamente cubre el requisito aunque el texto del requisito no repita el término", () => {
    const job = parseJobPosting({
      id: jobId3,
      rawText: "Buscamos experiencia con bases de datos relacionales.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-3-explicita",
      requirements: [
        {
          id: requirementId3,
          text: "Experiencia con bases de datos relacionales",
          kind: "technical",
          priority: "required",
          keywordIds: [keywordId3],
        },
      ],
      keywords: [{ id: keywordId3, canonical: "PostgreSQL", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    const report = matchProfileToJob(
      profileWithBullet("Administré bases de datos relacionales con PostgreSQL en producción."),
      job,
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId3]);
  });

  it("un requisito guardado antes de la Fase 3, sin keywordIds, sigue dependiendo solo del texto", () => {
    const job = parseJobPosting({
      id: jobId3,
      rawText: "Buscamos experiencia con PostgreSQL.",
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash: "fase-3-sin-keywordids",
      requirements: [
        { id: requirementId3, text: "Experiencia con PostgreSQL", kind: "technical", priority: "required" },
      ],
      keywords: [{ id: keywordId3, canonical: "PostgreSQL", aliases: [], frequency: 1, origin: "requisitos" }],
    });

    expect(job.requirements[0]?.keywordIds).toEqual([]);

    const report = matchProfileToJob(profileWithBullet("Administré bases de datos PostgreSQL."), job);

    expect(report.matchResults[0]?.status).toBe("covered");
  });
});

// Fase 4.1 del plan de auditoría (docs/07-plan-auditoria-matching.md): una
// tecnología de la tabla de categorías deja el requisito de esa categoría en
// `partial`. No lo cubre. Una habilidad sin bullet sigue sin cubrirlo.
describe("Fase 4.1 - equivalencia de categoría en partial", () => {
  const profileId41 = "34111111-1111-4111-8111-111111111111";
  const experienceId41 = "34111111-2222-4222-8222-222222222222";
  const projectId41 = "34111111-2222-4222-8222-222222222223";
  const jobId41 = "34111111-4444-4444-8444-444444444444";

  function profileWith(input: {
    bullets?: Array<{ id: string; text: string }>;
    projectBullets?: Array<{ id: string; text: string }>;
    skills?: Array<{ id: string; name: string }>;
  }) {
    return confirmProfile(
      parseProfile({
        id: profileId41,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId41,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: input.bullets ?? [{ id: "34111111-3333-4333-8333-333333333330", text: "Mantuve el servicio en producción." }],
          },
        ],
        education: [],
        skills: (input.skills ?? []).map((skill) => ({ ...skill, source: "declared_by_user" as const })),
        projects:
          input.projectBullets === undefined
            ? []
            : [{ id: projectId41, name: "avilab", description: null, url: null, bullets: input.projectBullets }],
      }),
    );
  }

  function jobFor(requirementId: string, text: string, contentHash: string) {
    return parseJobPosting({
      id: jobId41,
      rawText: text,
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash,
      requirements: [{ id: requirementId, text, kind: "technical", priority: "required" }],
      keywords: [],
    });
  }

  it("Qdrant en un bullet deja «bases de datos vectoriales» en partial, no en covered", () => {
    const bulletId = "34111111-3333-4333-8333-333333333331";
    const requirementId = "34111111-5555-4555-8555-555555555551";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      jobFor(requirementId, "Experiencia con bases de datos vectoriales", "fase-4-1-qdrant"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un empleo, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("Qdrant también respalda la frase en inglés «vector database», con la misma nota", () => {
    const bulletId = "34111111-3333-4333-8333-333333333332";
    const requirementId = "34111111-5555-4555-8555-555555555552";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      jobFor(requirementId, "Experience with a vector database", "fase-4-1-vector-database"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un empleo, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("el texto literal del requisito sigue en covered, aunque la tabla conozca la categoría", () => {
    const bulletId = "34111111-3333-4333-8333-333333333333";
    const requirementId = "34111111-5555-4555-8555-555555555553";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Implementé bases de datos vectoriales para el buscador." }] }),
      jobFor(requirementId, "Experiencia con bases de datos vectoriales", "fase-4-1-literal"),
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBeNull();
  });

  it("Qdrant junto al texto literal no baja un cubierto a partial", () => {
    const bulletId = "34111111-3333-4333-8333-333333333334";
    const requirementId = "34111111-5555-4555-8555-555555555554";
    const report = matchProfileToJob(
      profileWith({
        bullets: [{ id: bulletId, text: "Implementé bases de datos vectoriales con Qdrant." }],
      }),
      jobFor(requirementId, "Experiencia con bases de datos vectoriales", "fase-4-1-literal-y-qdrant"),
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.matchResults[0]?.note).toBeNull();
  });

  it("Qdrant solo en habilidades deja la categoría en gap", () => {
    const requirementId = "34111111-5555-4555-8555-555555555555";
    const report = matchProfileToJob(
      profileWith({ skills: [{ id: "34111111-3333-4333-8333-333333333335", name: "Qdrant" }] }),
      jobFor(requirementId, "Experiencia con bases de datos vectoriales", "fase-4-1-skill"),
    );

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });

  it("colas de Redis dejan «procesamiento asíncrono» en partial", () => {
    const bulletId = "34111111-3333-4333-8333-333333333336";
    const requirementId = "34111111-5555-4555-8555-555555555556";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Procesé eventos con colas de Redis." }] }),
      jobFor(requirementId, "Experiencia con procesamiento asíncrono", "fase-4-1-redis"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«colas de Redis», en un empleo, respalda la categoría «procesamiento asíncrono» y no alcanza para cubrir el requisito.",
    );
  });

  it("Celery deja «procesamiento asíncrono» en partial", () => {
    const bulletId = "34111111-3333-4333-8333-333333333337";
    const requirementId = "34111111-5555-4555-8555-555555555557";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Envié tareas con Celery." }] }),
      jobFor(requirementId, "Experiencia con procesamiento asíncrono", "fase-4-1-celery"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Celery», en un empleo, respalda la categoría «procesamiento asíncrono» y no alcanza para cubrir el requisito.",
    );
  });

  it("colas de Redis y Celery en el mismo bullet se nombran juntas", () => {
    const bulletId = "34111111-3333-4333-8333-333333333338";
    const requirementId = "34111111-5555-4555-8555-555555555558";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Procesé tareas con Celery y colas de Redis." }] }),
      jobFor(requirementId, "Experiencia con procesamiento asíncrono", "fase-4-1-ambos"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.note).toBe(
      "«colas de Redis» y «Celery», en un empleo, respaldan la categoría «procesamiento asíncrono» y no alcanzan para cubrir el requisito.",
    );
  });

  it("Redis como caché, sin colas ni Celery, deja «procesamiento asíncrono» en gap", () => {
    const requirementId = "34111111-5555-4555-8555-555555555559";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: "34111111-3333-4333-8333-333333333339", text: "Usé Redis como caché." }] }),
      jobFor(requirementId, "Experiencia con procesamiento asíncrono", "fase-4-1-cache"),
    );

    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  });

  it("Qdrant en un bullet de proyecto también deja la categoría en partial", () => {
    const bulletId = "34111111-3333-4333-8333-33333333333a";
    const requirementId = "34111111-5555-4555-8555-55555555555a";
    const report = matchProfileToJob(
      profileWith({ projectBullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      jobFor(requirementId, "Experiencia con una base de datos vectorial", "fase-4-1-proyecto"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un proyecto, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });
});

// Fase 4.2 del plan de auditoría (docs/07-plan-auditoria-matching.md): la tabla
// no cubre otro producto de la misma familia ni un stack distinto. Esas parejas
// siguen en gap. Si el requisito nombra el producto y también la categoría, la
// categoría queda en partial y el producto sigue faltando.
describe("Fase 4.2 - lo que la tabla no cubre", () => {
  const profileId42 = "34222222-1111-4111-8111-111111111111";
  const experienceId42 = "34222222-2222-4222-8222-222222222222";
  const jobId42 = "34222222-4444-4444-8444-444444444444";

  function profileWithBullet(bulletId: string, text: string) {
    return confirmProfile(
      parseProfile({
        id: profileId42,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId42,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [{ id: bulletId, text }],
          },
        ],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  function jobFor(
    requirementId: string,
    text: string,
    contentHash: string,
    keywords: Array<{ id: string; canonical: string }> = [],
  ) {
    return parseJobPosting({
      id: jobId42,
      rawText: text,
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash,
      requirements: [{ id: requirementId, text, kind: "technical", priority: "required" }],
      keywords: keywords.map((keyword) => ({ ...keyword, aliases: [], frequency: 1, origin: "requisitos" })),
    });
  }

  function expectGap(bulletId: string, bullet: string, requirementId: string, text: string, contentHash: string, keywords: Array<{ id: string; canonical: string }> = []) {
    const report = matchProfileToJob(
      profileWithBullet(bulletId, bullet),
      jobFor(requirementId, text, contentHash, keywords),
    );
    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([]);
    expect(report.matchResults[0]?.note).toBe("Sin evidencia en el perfil.");
  }

  it("Qdrant no cubre Pinecone", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333331",
      "Indexé embeddings con Qdrant.",
      "34222222-5555-4555-8555-555555555551",
      "Experiencia con Pinecone",
      "fase-4-2-pinecone",
      [{ id: "34222222-6666-4666-8666-666666666661", canonical: "Pinecone" }],
    );
  });

  it("colas de Redis no cubren RabbitMQ ni SQS", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333332",
      "Procesé eventos con colas de Redis.",
      "34222222-5555-4555-8555-555555555552",
      "Experiencia con RabbitMQ o SQS",
      "fase-4-2-rabbit",
      [
        { id: "34222222-6666-4666-8666-666666666662", canonical: "RabbitMQ" },
        { id: "34222222-6666-4666-8666-666666666663", canonical: "SQS" },
      ],
    );
  });

  it("Celery no cubre RabbitMQ ni SQS", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333333",
      "Envié tareas con Celery.",
      "34222222-5555-4555-8555-555555555553",
      "Experiencia con RabbitMQ o SQS",
      "fase-4-2-celery",
      [
        { id: "34222222-6666-4666-8666-666666666664", canonical: "RabbitMQ" },
        { id: "34222222-6666-4666-8666-666666666665", canonical: "SQS" },
      ],
    );
  });

  it("React no cubre Next.js", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333334",
      "Construí interfaces con React.",
      "34222222-5555-4555-8555-555555555554",
      "Experiencia con Next.js",
      "fase-4-2-next",
      [{ id: "34222222-6666-4666-8666-666666666666", canonical: "Next.js" }],
    );
  });

  it("Django no cubre Prisma", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333335",
      "Desarrollé el backend con Django.",
      "34222222-5555-4555-8555-555555555555",
      "Experiencia con Prisma",
      "fase-4-2-prisma",
      [{ id: "34222222-6666-4666-8666-666666666667", canonical: "Prisma" }],
    );
  });

  it("modelos de OpenAI no cubren la API de Anthropic", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333336",
      "Integré modelos de OpenAI.",
      "34222222-5555-4555-8555-555555555556",
      "Experiencia con la API de Anthropic",
      "fase-4-2-anthropic",
      [{ id: "34222222-6666-4666-8666-666666666668", canonical: "Anthropic" }],
    );
  });

  it("FastAPI no cubre microservicios", () => {
    expectGap(
      "34222222-3333-4333-8333-333333333337",
      "Implementé el orquestador en FastAPI.",
      "34222222-5555-4555-8555-555555555557",
      "Experiencia con microservicios",
      "fase-4-2-microservicios",
    );
  });

  it("colas de Redis dejan en partial un requisito que también nombra RabbitMQ", () => {
    const bulletId = "34222222-3333-4333-8333-333333333338";
    const requirementId = "34222222-5555-4555-8555-555555555558";
    const report = matchProfileToJob(
      profileWithBullet(bulletId, "Procesé eventos con colas de Redis."),
      jobFor(
        requirementId,
        "Experiencia con RabbitMQ o procesamiento asíncrono",
        "fase-4-2-mixto",
        [{ id: "34222222-6666-4666-8666-666666666669", canonical: "RabbitMQ" }],
      ),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "Falta evidencia en bullets de: RabbitMQ. «colas de Redis», en un empleo, respalda la categoría «procesamiento asíncrono» y no alcanza para cubrir el requisito.",
    );
  });
});

// Fase 4.3 del plan de auditoría (docs/07-plan-auditoria-matching.md): la nota
// de categoría dice si el bullet es de un empleo, de un proyecto, o de los dos.
// Una nota léxica, sin categoría, no lleva ese origen.
describe("Fase 4.3 - empleo o proyecto en la nota", () => {
  const profileId43 = "34333333-1111-4111-8111-111111111111";
  const experienceId43 = "34333333-2222-4222-8222-222222222222";
  const projectId43 = "34333333-2222-4222-8222-222222222223";
  const jobId43 = "34333333-4444-4444-8444-444444444444";

  function profileWith(input: {
    bullets: Array<{ id: string; text: string }>;
    projectBullets?: Array<{ id: string; text: string }>;
  }) {
    return confirmProfile(
      parseProfile({
        id: profileId43,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
        summary: null,
        language: "es",
        experiences: [
          {
            id: experienceId43,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: input.bullets,
          },
        ],
        education: [],
        skills: [],
        projects:
          input.projectBullets === undefined
            ? []
            : [{ id: projectId43, name: "avilab", description: null, url: null, bullets: input.projectBullets }],
      }),
    );
  }

  function jobFor(requirementId: string, text: string, contentHash: string, keywords: Array<{ id: string; canonical: string }> = []) {
    return parseJobPosting({
      id: jobId43,
      rawText: text,
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      contentHash,
      requirements: [{ id: requirementId, text, kind: "technical", priority: "required" }],
      keywords: keywords.map((keyword) => ({ ...keyword, aliases: [], frequency: 1, origin: "requisitos" })),
    });
  }

  it("un bullet de empleo dice «en un empleo»", () => {
    const bulletId = "34333333-3333-4333-8333-333333333331";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Indexé embeddings con Qdrant." }] }),
      jobFor("34333333-5555-4555-8555-555555555551", "Experiencia con bases de datos vectoriales", "fase-4-3-empleo"),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un empleo, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("dos bullets del mismo empleo siguen diciendo «en un empleo»", () => {
    const firstId = "34333333-3333-4333-8333-333333333332";
    const secondId = "34333333-3333-4333-8333-333333333333";
    const report = matchProfileToJob(
      profileWith({
        bullets: [
          { id: firstId, text: "Indexé embeddings con Qdrant." },
          { id: secondId, text: "Consulté esa base en Qdrant." },
        ],
      }),
      jobFor("34333333-5555-4555-8555-555555555552", "Experiencia con bases de datos vectoriales", "fase-4-3-dos-empleos"),
    );

    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([firstId, secondId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un empleo, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("un bullet de proyecto dice «en un proyecto», aunque haya un empleo sin esa evidencia", () => {
    const projectBulletId = "34333333-3333-4333-8333-333333333334";
    const report = matchProfileToJob(
      profileWith({
        bullets: [{ id: "34333333-3333-4333-8333-333333333335", text: "Mantuve el servicio en producción." }],
        projectBullets: [{ id: projectBulletId, text: "Indexé embeddings con Qdrant." }],
      }),
      jobFor("34333333-5555-4555-8555-555555555553", "Experiencia con una base de datos vectorial", "fase-4-3-proyecto"),
    );

    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([projectBulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un proyecto, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("el mismo término en un empleo y en un proyecto nombra los dos orígenes", () => {
    const experienceBulletId = "34333333-3333-4333-8333-333333333336";
    const projectBulletId = "34333333-3333-4333-8333-333333333337";
    const report = matchProfileToJob(
      profileWith({
        bullets: [{ id: experienceBulletId, text: "Indexé embeddings con Qdrant." }],
        projectBullets: [{ id: projectBulletId, text: "También indexé embeddings con Qdrant." }],
      }),
      jobFor("34333333-5555-4555-8555-555555555554", "Experiencia con bases de datos vectoriales", "fase-4-3-ambos"),
    );

    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([experienceBulletId, projectBulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«Qdrant», en un empleo y en un proyecto, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito.",
    );
  });

  it("colas de Redis en un empleo y Celery en un proyecto nombran los dos orígenes", () => {
    const experienceBulletId = "34333333-3333-4333-8333-333333333338";
    const projectBulletId = "34333333-3333-4333-8333-333333333339";
    const report = matchProfileToJob(
      profileWith({
        bullets: [{ id: experienceBulletId, text: "Procesé eventos con colas de Redis." }],
        projectBullets: [{ id: projectBulletId, text: "Envié tareas con Celery." }],
      }),
      jobFor("34333333-5555-4555-8555-555555555555", "Experiencia con procesamiento asíncrono", "fase-4-3-mixto"),
    );

    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([experienceBulletId, projectBulletId]);
    expect(report.matchResults[0]?.note).toBe(
      "«colas de Redis» y «Celery», en un empleo y en un proyecto, respaldan la categoría «procesamiento asíncrono» y no alcanzan para cubrir el requisito.",
    );
  });

  it("una nota léxica, sin categoría, no dice de dónde sale el bullet", () => {
    const bulletId = "34333333-3333-4333-8333-33333333333a";
    const report = matchProfileToJob(
      profileWith({ bullets: [{ id: bulletId, text: "Construí interfaces con React." }] }),
      jobFor(
        "34333333-5555-4555-8555-555555555556",
        "Experiencia con React y Next.js",
        "fase-4-3-lexico",
        [
          { id: "34333333-6666-4666-8666-666666666661", canonical: "React" },
          { id: "34333333-6666-4666-8666-666666666662", canonical: "Next.js" },
        ],
      ),
    );

    expect(report.matchResults[0]?.status).toBe("partial");
    expect(report.matchResults[0]?.evidenceBulletIds).toEqual([bulletId]);
    expect(report.matchResults[0]?.note).toBe("Falta evidencia en bullets de: Next.js.");
  });
});

// Fase 5.2 del plan de auditoría: aviso si la oferta pide GitHub o portfolio y no hay enlaces.
const LINKS_NOTICE = "La oferta pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces.";

describe("Fase 5.2 - aviso de enlaces vacíos", () => {
  const profileId52 = "35353535-1111-4111-8111-111111111111";
  const jobId52 = "35353535-1212-4121-8121-121212121212";
  const requirementId52 = "35353535-1313-4131-8131-131313131313";

  function profileWithLinks(links: { label: string; url: string }[]) {
    return confirmProfile(
      parseProfile({
        id: profileId52,
        status: "needs_review",
        contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links },
        summary: null,
        language: "es",
        experiences: [],
        education: [],
        skills: [],
        projects: [],
      }),
    );
  }

  function jobWithText(rawText: string) {
    return parseJobPosting({
      id: jobId52,
      rawText,
      title: null,
      company: null,
      language: "es",
      contentHash: "fase-5-2",
      requirements: [
        {
          id: requirementId52,
          text: "Experiencia y conocimientos",
          kind: "functional",
          priority: "preferred",
        },
      ],
      keywords: [],
    });
  }

  function noticeFor(rawText: string, links: { label: string; url: string }[] = []) {
    const report = matchProfileToJob(profileWithLinks(links), jobWithText(rawText));
    return report.linksNotice;
  }

  it("avisa si el texto pide un enlace y el perfil no tiene", () => {
    expect(noticeFor("Enviar el CV incluyendo enlace a GitHub/portfolio.")).toBe(LINKS_NOTICE);
    expect(noticeFor("Adjuntá tu portafolio.")).toBe(LINKS_NOTICE);
    expect(noticeFor("Include a link to GitHub.")).toBe(LINKS_NOTICE);
    expect(noticeFor("Add your GitHub link.")).toBe(LINKS_NOTICE);
  });

  it("no avisa por GitHub como tecnología, ni si ya hay un enlace", () => {
    expect(noticeFor("CI/CD con GitHub Actions.")).toBeNull();
    expect(noticeFor("GitHub/GitLab, pull requests, trunk-based o git-flow.")).toBeNull();
    expect(noticeFor("Experiencia con GitHub.")).toBeNull();
    expect(noticeFor("Buscamos TypeScript y PostgreSQL.")).toBeNull();
    expect(
      noticeFor("Enviar el CV incluyendo enlace a GitHub.", [
        { label: "Web", url: "https://example.com" },
      ]),
    ).toBeNull();
  });

  it("no cambia el aviso de idioma ni el resultado del requisito", () => {
    const report = matchProfileToJob(
      profileWithLinks([]),
      jobWithText("Enviar el CV incluyendo enlace a GitHub/portfolio."),
    );

    expect(report.languageNotice).toBeNull();
    expect(report.matchResults[0]?.status).toBe("gap");
    expect(report.matchResults[0]?.note).toBe("El requisito no tiene términos comparables.");
  });
});
