import { confirmProfile, parseProfile, type ConfirmedProfile } from "./profile.ts";

export const sampleIds = {
  profile: "11111111-1111-4111-8111-111111111111",
  experience: "22222222-2222-4222-8222-222222222222",
  bullet: "33333333-3333-4333-8333-333333333333",
  skill: "44444444-4444-4444-8444-444444444444",
  project: "55555555-5555-4555-8555-555555555555",
  projectBullet: "66666666-6666-4666-8666-666666666666",
  education: "77777777-7777-4777-8777-777777777777",
} as const;

export function sampleProfileInput() {
  return {
    id: sampleIds.profile,
    status: "needs_review" as const,
    contact: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+54 11 0000 0000",
      location: "Buenos Aires",
      links: [{ label: "Web", url: "https://example.com" }],
    },
    summary: "Desarrolla servicios con TypeScript.",
    language: "es",
    experiences: [
      {
        id: sampleIds.experience,
        organization: "Analytical Engines",
        role: "Desarrolladora",
        span: { start: "2020-01", end: null, ongoing: true },
        location: null,
        bullets: [{ id: sampleIds.bullet, text: "Mantuve APIs en TypeScript." }],
      },
    ],
    education: [
      {
        id: sampleIds.education,
        institution: "Universidad de Ejemplo",
        title: "Ingeniería",
        span: { start: "2014-03", end: "2019-12", ongoing: false },
      },
    ],
    skills: [{ id: sampleIds.skill, name: "TypeScript", source: "declared_by_user" as const }],
    projects: [
      {
        id: sampleIds.project,
        name: "Motor analítico",
        description: null,
        url: null,
        bullets: [{ id: sampleIds.projectBullet, text: "Modelé el cálculo." }],
      },
    ],
  };
}

export function sampleDraftProfile() {
  return parseProfile(sampleProfileInput());
}

export function sampleConfirmedProfile(): ConfirmedProfile {
  return confirmProfile(sampleDraftProfile());
}
