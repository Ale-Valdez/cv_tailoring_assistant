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
