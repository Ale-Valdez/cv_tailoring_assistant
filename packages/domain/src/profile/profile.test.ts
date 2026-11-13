import { describe, expect, it } from "vitest";

import { DomainError } from "../errors.ts";
import { createProfileId } from "../ids.ts";
import { confirmProfile, parseProfile, profileForModel } from "./profile.ts";
import { sampleConfirmedProfile, sampleDraftProfile, sampleIds } from "./sample-profile.ts";

function domainFailure(run: () => unknown): DomainError {
  try {
    run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("Se esperaba un DomainError.");
}

function emptyProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: sampleIds.profile,
    status: "needs_review",
    contact: { name: "", email: null, phone: null, location: null, links: [] },
    summary: null,
    language: "",
    experiences: [],
    education: [],
    skills: [],
    projects: [],
    ...overrides,
  };
}

describe("parseProfile", () => {
  it("acepta un borrador con huecos", () => {
    const profile = parseProfile(emptyProfile());
    expect(profile.status).toBe("needs_review");
    expect(profile.contact.name).toBe("");
  });

  it("rechaza una fecha de fin anterior al inicio", () => {
    const error = domainFailure(() =>
      parseProfile(
        emptyProfile({
          experiences: [
            {
              id: sampleIds.experience,
              organization: "Acme",
              role: "Dev",
              span: { start: "2024-05", end: "2020-01", ongoing: false },
              location: null,
              bullets: [],
            },
          ],
        }),
      ),
    );
    expect(error.code).toBe("invalid_input");
    expect(error.message).toContain("fecha de fin es anterior");
  });

  it("rechaza un período en curso con fecha de fin", () => {
    const error = domainFailure(() =>
      parseProfile(
        emptyProfile({
          experiences: [
            {
              id: sampleIds.experience,
              organization: "Acme",
              role: "Dev",
              span: { start: "2024-05", end: "2025-01", ongoing: true },
              location: null,
              bullets: [],
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("en curso");
  });

  it("rechaza bullets repetidos entre experiencia y proyecto", () => {
    const error = domainFailure(() =>
      parseProfile(
        emptyProfile({
          experiences: [
            {
              id: sampleIds.experience,
              organization: "Acme",
              role: "Dev",
              span: { start: null, end: null, ongoing: false },
              location: null,
              bullets: [{ id: sampleIds.bullet, text: "Hice esto" }],
            },
          ],
          projects: [
            {
              id: sampleIds.project,
              name: "Demo",
              description: null,
              url: null,
              bullets: [{ id: sampleIds.bullet, text: "Lo mismo" }],
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("bullets con el mismo identificador");
  });

  it("rechaza habilidades repetidas sin distinguir mayúsculas", () => {
    const error = domainFailure(() =>
      parseProfile(
        emptyProfile({
          skills: [
            { id: sampleIds.skill, name: "TypeScript", source: "extracted_from_cv" },
            {
              id: "88888888-8888-4888-8888-888888888888",
              name: "typescript",
              source: "declared_by_user",
            },
          ],
        }),
      ),
    );
    expect(error.message).toContain("está repetida");
  });

  it("rechaza un email inválido y una URL que no lo es", () => {
    const emailError = domainFailure(() =>
      parseProfile(
        emptyProfile({
          contact: {
            name: "Ada",
            email: "no-es-email",
            phone: null,
            location: null,
            links: [],
          },
        }),
      ),
    );
    expect(emailError.message).toContain("email");

    const urlError = domainFailure(() =>
      parseProfile(
        emptyProfile({
          contact: {
            name: "Ada",
            email: null,
            phone: null,
            location: null,
            links: [{ label: "Web", url: "no-es-url" }],
          },
        }),
      ),
    );
    expect(urlError.message).toContain("URL");
  });

  it("rechaza campos desconocidos", () => {
    const error = domainFailure(() => parseProfile({ ...emptyProfile(), extra: true }));
    expect(error.code).toBe("invalid_input");
  });

  it("rechaza un perfil confirmado que todavía no está listo", () => {
    const error = domainFailure(() => parseProfile(emptyProfile({ status: "confirmed" })));
    expect(error.message).toContain("necesita un nombre");
  });
});

describe("confirmProfile", () => {
  it("exige nombre, idioma y los datos de cada bloque", () => {
    const draft = parseProfile(emptyProfile());
    const error = domainFailure(() => confirmProfile(draft));
    expect(error.code).toBe("profile_not_ready");
    expect(error.message).toContain("nombre");
    expect(draft.status).toBe("needs_review");
  });

  it("exige rol y organización en cada experiencia", () => {
    const draft = parseProfile(
      emptyProfile({
        contact: { name: "Ada", email: null, phone: null, location: null, links: [] },
        language: "es",
        experiences: [
          {
            id: sampleIds.experience,
            organization: "",
            role: "",
            span: { start: null, end: null, ongoing: false },
            location: null,
            bullets: [],
          },
        ],
      }),
    );
    const error = domainFailure(() => confirmProfile(draft));
    expect(error.message).toContain("organización y rol");
  });

  it("confirma un perfil completo y se puede volver a confirmar", () => {
    const draft = sampleDraftProfile();
    const confirmed = confirmProfile(draft);
    expect(draft.status).toBe("needs_review");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmProfile(confirmed).status).toBe("confirmed");
    expect(confirmed.skills[0]?.source).toBe("declared_by_user");
  });
});

describe("profileForModel", () => {
  it("quita el bloque de contacto", () => {
    const model = profileForModel(sampleConfirmedProfile());
    expect(model).not.toHaveProperty("contact");
    expect(JSON.stringify(model)).not.toContain("ada@example.com");
    expect(model.summary).toContain("TypeScript");
    expect(model.experiences).toHaveLength(1);
  });
});

describe("createProfileId", () => {
  it("genera un id de perfil", () => {
    expect(createProfileId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
