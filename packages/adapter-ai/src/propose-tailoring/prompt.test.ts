import type { TailoringProposalInput } from "@cv-tailor/application";
import { confirmProfile, matchProfileToJob, parseJobPosting, parseProfile, profileForModel } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { buildProposeTailoringPrompt } from "./prompt.ts";

function input(): TailoringProposalInput {
  const profile = confirmProfile(
    parseProfile({
      id: "11111111-1111-4111-8111-111111111111",
      status: "needs_review",
      contact: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+54 11 0000 0000",
        location: null,
        links: [],
      },
      summary: null,
      language: "es",
      experiences: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [{ id: "33333333-3333-4333-8333-333333333333", text: "Mantuve APIs." }],
        },
      ],
      education: [],
      skills: [],
      projects: [],
    }),
  );
  const job = parseJobPosting({
    id: "12121212-1212-4121-8121-121212121212",
    rawText: "Buscamos TypeScript.",
    title: null,
    company: null,
    language: "en",
    contentHash: "abc",
    requirements: [],
    keywords: [],
  });
  return { profile: profileForModel(profile), job, match: matchProfileToJob(profile, job) };
}

describe("buildProposeTailoringPrompt", () => {
  it("pide no inventar ni traducir, omite el contacto y repite el rechazo del guard", () => {
    const context = input();
    const first = buildProposeTailoringPrompt({ ...context, feedback: null });
    expect(first.system).toContain("sin inventar");
    expect(first.system).toContain("no traduzcas");
    expect(first.system).toContain("ids exactos");
    expect(first.user).toContain("33333333-3333-4333-8333-333333333333");
    expect(first.user).not.toContain("ada@example.com");
    expect(first.user).not.toContain("0000");
    expect(first.user).not.toContain("fabrication guard");

    const retry = buildProposeTailoringPrompt({
      ...context,
      feedback: "summary: El texto introduce «Kubernetes», que no está en el perfil.",
    });
    expect(retry.user).toContain("Kubernetes");
    expect(retry.user).toContain("lista vacía");
  });
});