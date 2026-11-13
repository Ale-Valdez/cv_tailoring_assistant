import {
  confirmProfile,
  parseProfile,
  parseTailoredCv,
  type ConfirmedProfile,
  type TailoredCv,
} from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import type { CvHtmlRenderer } from "../ports/cv-html-renderer.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";
import type { TailoredCvRepository } from "../ports/tailored-cv-repository.ts";
import { previewTailoredCv } from "./preview-tailored-cv.ts";

const profileId = "11111111-1111-4111-8111-111111111111";
const jobId = "12121212-1212-4121-8121-121212121212";
const bulletId = "33333333-3333-4333-8333-333333333333";
const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tailoredCvId = "abababab-abab-4aba-8aba-abababababab";

function profile(): ConfirmedProfile {
  return confirmProfile(
    parseProfile({
      id: profileId,
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
}

function cv(status: "pending" | "accepted"): TailoredCv {
  return parseTailoredCv({
    id: tailoredCvId,
    profileId,
    jobPostingId: jobId,
    status: status === "pending" ? "in_review" : "final",
    snapshot: profile(),
    suggestions: [
      {
        id: suggestionId,
        target: { type: "bullet", bulletId },
        before: "Mantuve APIs en TypeScript.",
        after: "Mantuve APIs en TypeScript para el servicio.",
        reason: "Aclara el alcance.",
        evidence: [{ type: "bullet", bulletId }],
        status,
        validation: { outcome: "valid" },
      },
    ],
    matchResults: [],
    exports: [],
  });
}

function deps(current: TailoredCv | null, rendered: ConfirmedProfile[]) {
  const profiles: ProfileRepository = {
    save: async () => undefined,
    findLatest: async () => profile(),
  };
  const tailoredCvs: TailoredCvRepository = {
    save: async () => undefined,
    findById: async () => current,
    findByProfileAndJob: async () => current,
  };
  const htmlRenderer: CvHtmlRenderer = {
    render(value) {
      rendered.push(value);
      const text = value.experiences[0]?.bullets[0]?.text ?? "";
      return `<html><h1>${value.contact.name}</h1><p>${text}</p></html>`;
    },
  };
  return { profiles, tailoredCvs, htmlRenderer };
}

describe("previewTailoredCv", () => {
  it("arma el HTML con el contacto y sin aplicar una sugerencia pendiente", async () => {
    const rendered: ConfirmedProfile[] = [];
    const html = await previewTailoredCv(deps(cv("pending"), rendered), jobId);

    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Mantuve APIs en TypeScript.");
    expect(html).not.toContain("para el servicio");
    expect(rendered).toHaveLength(1);
  });

  it("aplica una sugerencia aceptada antes de renderizar", async () => {
    const html = await previewTailoredCv(deps(cv("accepted"), []), jobId);

    expect(html).toContain("Mantuve APIs en TypeScript para el servicio.");
  });

  it("avisa cuando todavía no hay propuesta", async () => {
    await expect(previewTailoredCv(deps(null, []), jobId)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "proposal_not_found",
    });
  });

  it("avisa cuando no hay perfil confirmado", async () => {
    const base = deps(cv("pending"), []);
    const profiles: ProfileRepository = { save: async () => undefined, findLatest: async () => null };

    await expect(previewTailoredCv({ ...base, profiles }, jobId)).rejects.toBeInstanceOf(ApplicationError);
    await expect(previewTailoredCv({ ...base, profiles }, jobId)).rejects.toMatchObject({
      code: "profile_not_found",
    });
  });
});
