import { describe, expect, it } from "vitest";

import { DomainError } from "../errors.ts";
import { confirmProfile, parseProfile, type ConfirmedProfile } from "../profile/profile.ts";
import { sampleConfirmedProfile, sampleIds } from "../profile/sample-profile.ts";
import { profileForRender } from "./apply-suggestions.ts";
import { parseTailoredCv, type TailoredCv } from "./tailored-cv.ts";

const tailoredCvId = "abababab-abab-4aba-8aba-abababababab";
const jobPostingId = "12121212-1212-4121-8121-121212121212";
const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const skillDocker = "88888888-8888-4888-8888-888888888888";

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

function profileWithSkills(): ConfirmedProfile {
  return confirmProfile(
    parseProfile({
      ...sampleConfirmedProfile(),
      status: "needs_review",
      skills: [
        { id: sampleIds.skill, name: "TypeScript", source: "extracted_from_cv" },
        { id: skillDocker, name: "Docker", source: "declared_by_user" },
      ],
    }),
  );
}

function cvFor(
  snapshot: ConfirmedProfile,
  suggestion: Record<string, unknown>,
): TailoredCv {
  return parseTailoredCv({
    id: tailoredCvId,
    profileId: snapshot.id,
    jobPostingId,
    status: "in_review",
    snapshot,
    suggestions: [
      {
        id: suggestionId,
        reason: "Acerca el texto a la oferta.",
        evidence: [{ type: "bullet", bulletId: sampleIds.bullet }],
        status: "accepted",
        validation: { outcome: "valid" },
        ...suggestion,
      },
    ],
    matchResults: [],
    exports: [],
  });
}

describe("profileForRender", () => {
  it("aplica un bullet aceptado y conserva el contacto", () => {
    const snapshot = sampleConfirmedProfile();
    const rendered = profileForRender(
      cvFor(snapshot, {
        target: { type: "bullet", bulletId: sampleIds.bullet },
        before: "Mantuve APIs en TypeScript.",
        after: "Mantuve APIs en TypeScript para el servicio.",
      }),
    );

    expect(rendered.experiences[0]?.bullets[0]?.text).toBe("Mantuve APIs en TypeScript para el servicio.");
    expect(rendered.contact).toEqual(snapshot.contact);
    expect(snapshot.experiences[0]?.bullets[0]?.text).toBe("Mantuve APIs en TypeScript.");
  });

  it("aplica un bullet de proyecto editado", () => {
    const rendered = profileForRender(
      cvFor(sampleConfirmedProfile(), {
        target: { type: "bullet", bulletId: sampleIds.projectBullet },
        before: "Modelé el cálculo.",
        after: "Modelé el cálculo del motor.",
        status: "edited",
        evidence: [{ type: "bullet", bulletId: sampleIds.projectBullet }],
      }),
    );

    expect(rendered.projects[0]?.bullets[0]?.text).toBe("Modelé el cálculo del motor.");
  });

  it("deja el texto original si la sugerencia está pendiente o rechazada", () => {
    const snapshot = sampleConfirmedProfile();
    for (const status of ["pending", "rejected"] as const) {
      const rendered = profileForRender(
        cvFor(snapshot, {
          target: { type: "bullet", bulletId: sampleIds.bullet },
          before: "Mantuve APIs en TypeScript.",
          after: "Mantuve APIs en TypeScript para el servicio.",
          status,
        }),
      );
      expect(rendered.experiences[0]?.bullets[0]?.text).toBe("Mantuve APIs en TypeScript.");
    }
  });

  it("no aplica una sugerencia aceptada que el guard no marcó válida", () => {
    const rendered = profileForRender(
      cvFor(sampleConfirmedProfile(), {
        target: { type: "summary" },
        before: "Desarrolla servicios con TypeScript.",
        after: "Lidera equipos de cincuenta personas.",
        validation: { outcome: "invalid", reasons: ["El perfil no respalda «cincuenta»."] },
        evidence: [{ type: "summary" }],
      }),
    );

    expect(rendered.summary).toBe("Desarrolla servicios con TypeScript.");
  });

  it("sustituye el resumen cuando la sugerencia editada es válida", () => {
    const rendered = profileForRender(
      cvFor(sampleConfirmedProfile(), {
        target: { type: "summary" },
        before: "Desarrolla servicios con TypeScript.",
        after: "Desarrolla servicios con TypeScript y APIs.",
        status: "edited",
        evidence: [{ type: "summary" }],
      }),
    );

    expect(rendered.summary).toBe("Desarrolla servicios con TypeScript y APIs.");
  });

  it("reordena las habilidades y conserva id, nombre y origen", () => {
    const snapshot = profileWithSkills();
    const rendered = profileForRender(
      cvFor(snapshot, {
        target: { type: "skill_order" },
        before: "TypeScript\nDocker",
        after: "docker\nTypeScript",
        evidence: [{ type: "skill", skillId: sampleIds.skill }],
      }),
    );

    expect(rendered.skills.map((skill) => skill.name)).toEqual(["Docker", "TypeScript"]);
    expect(rendered.skills.map((skill) => skill.id)).toEqual([skillDocker, sampleIds.skill]);
    expect(rendered.skills.map((skill) => skill.source)).toEqual(["declared_by_user", "extracted_from_cv"]);
    expect(snapshot.skills.map((skill) => skill.name)).toEqual(["TypeScript", "Docker"]);
  });

  it("rechaza un orden que no es el de las habilidades del perfil", () => {
    const error = domainFailure(() =>
      profileForRender(
        cvFor(profileWithSkills(), {
          target: { type: "skill_order" },
          before: "TypeScript\nDocker",
          after: "Docker\nKubernetes",
          evidence: [{ type: "skill", skillId: sampleIds.skill }],
        }),
      ),
    );

    expect(error.message).toBe("El orden de habilidades no coincide con el perfil.");
  });

  it("rechaza un bullet que no está en la instantánea", () => {
    const cv = cvFor(sampleConfirmedProfile(), {
      target: { type: "bullet", bulletId: sampleIds.bullet },
      before: "Mantuve APIs en TypeScript.",
      after: "Mantuve APIs en TypeScript para el servicio.",
    });
    const broken = {
      ...cv,
      suggestions: [
        {
          ...cv.suggestions[0],
          target: { type: "bullet" as const, bulletId: "99999999-9999-4999-8999-999999999999" },
        },
      ],
    };

    const error = domainFailure(() => profileForRender(broken as TailoredCv));
    expect(error.message).toBe("La sugerencia apunta a un bullet que no está en el perfil.");
  });
});

describe("Fase 6.1 - profileForRender reordena bullets", () => {
  const bulletNode = "61616161-6161-4161-8161-616161616161";
  const projectSecond = "62626262-6262-4262-8262-626262626262";
  const secondSuggestionId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const react = "Mantuve APIs en TypeScript.";
  const node = "Diseñé el esquema en PostgreSQL.";

  function profileWithBullets(): ConfirmedProfile {
    return confirmProfile(
      parseProfile({
        ...sampleConfirmedProfile(),
        status: "needs_review",
        experiences: [
          {
            id: sampleIds.experience,
            organization: "Analytical Engines",
            role: "Desarrolladora",
            span: { start: "2020-01", end: null, ongoing: true },
            location: null,
            bullets: [
              { id: sampleIds.bullet, text: react },
              { id: bulletNode, text: node },
            ],
          },
        ],
        projects: [
          {
            id: sampleIds.project,
            name: "Motor analítico",
            description: null,
            url: null,
            bullets: [
              { id: sampleIds.projectBullet, text: "Modelé el cálculo." },
              { id: projectSecond, text: "Publiqué el tablero." },
            ],
          },
        ],
      }),
    );
  }

  function cvWith(snapshot: ConfirmedProfile, suggestions: Record<string, unknown>[]): TailoredCv {
    return parseTailoredCv({
      id: tailoredCvId,
      profileId: snapshot.id,
      jobPostingId,
      status: "in_review",
      snapshot,
      suggestions: suggestions.map((suggestion, index) => ({
        id: index === 0 ? suggestionId : secondSuggestionId,
        reason: "Sube lo que la oferta pide.",
        evidence: [{ type: "bullet", bulletId: sampleIds.bullet }],
        status: "accepted",
        validation: { outcome: "valid" },
        ...suggestion,
      })),
      matchResults: [],
      exports: [],
    });
  }

  it("reordena los bullets de un empleo y conserva id y texto", () => {
    const snapshot = profileWithBullets();
    const rendered = profileForRender(
      cvWith(snapshot, [
        {
          target: { type: "bullet_order", owner: { type: "experience", experienceId: sampleIds.experience } },
          before: `${react}\n${node}`,
          after: `diseñé el esquema en postgresql.\n${react}`,
        },
      ]),
    );

    expect(rendered.experiences[0]?.bullets.map((bullet) => bullet.id)).toEqual([bulletNode, sampleIds.bullet]);
    expect(rendered.experiences[0]?.bullets.map((bullet) => bullet.text)).toEqual([node, react]);
    expect(snapshot.experiences[0]?.bullets.map((bullet) => bullet.id)).toEqual([sampleIds.bullet, bulletNode]);
  });

  it("reordena los bullets de un proyecto", () => {
    const rendered = profileForRender(
      cvWith(profileWithBullets(), [
        {
          target: { type: "bullet_order", owner: { type: "project", projectId: sampleIds.project } },
          before: "Modelé el cálculo.\nPubliqué el tablero.",
          after: "Publiqué el tablero.\nModelé el cálculo.",
          evidence: [{ type: "bullet", bulletId: sampleIds.projectBullet }],
        },
      ]),
    );

    expect(rendered.projects[0]?.bullets.map((bullet) => bullet.text)).toEqual([
      "Publiqué el tablero.",
      "Modelé el cálculo.",
    ]);
    expect(rendered.projects[0]?.bullets.map((bullet) => bullet.id)).toEqual([projectSecond, sampleIds.projectBullet]);
  });

  it("conserva el texto reescrito al reordenar, en cualquier orden de aplicación", () => {
    const snapshot = profileWithBullets();
    const rewrite = {
      target: { type: "bullet", bulletId: sampleIds.bullet },
      before: react,
      after: "Mantuve APIs en TypeScript para el servicio.",
    };
    const reorder = {
      target: { type: "bullet_order", owner: { type: "experience", experienceId: sampleIds.experience } },
      before: `${react}\n${node}`,
      after: `${node}\n${react}`,
    };
    for (const suggestions of [
      [rewrite, reorder],
      [reorder, rewrite],
    ]) {
      const rendered = profileForRender(cvWith(snapshot, suggestions));
      expect(rendered.experiences[0]?.bullets.map((bullet) => bullet.id)).toEqual([bulletNode, sampleIds.bullet]);
      expect(rendered.experiences[0]?.bullets.map((bullet) => bullet.text)).toEqual([
        node,
        "Mantuve APIs en TypeScript para el servicio.",
      ]);
    }
  });

  it("deja el orden original si la sugerencia está pendiente", () => {
    const rendered = profileForRender(
      cvWith(profileWithBullets(), [
        {
          target: { type: "bullet_order", owner: { type: "experience", experienceId: sampleIds.experience } },
          before: `${react}\n${node}`,
          after: `${node}\n${react}`,
          status: "pending",
        },
      ]),
    );
    expect(rendered.experiences[0]?.bullets.map((bullet) => bullet.id)).toEqual([sampleIds.bullet, bulletNode]);
  });

  it("rechaza un orden que no es el de los bullets del perfil", () => {
    const error = domainFailure(() =>
      profileForRender(
        cvWith(profileWithBullets(), [
          {
            target: { type: "bullet_order", owner: { type: "experience", experienceId: sampleIds.experience } },
            before: `${react}\n${node}`,
            after: `${react}\nDiseñé el esquema en Kubernetes.`,
          },
        ]),
      ),
    );
    expect(error.message).toBe("El orden de bullets no coincide con el perfil.");
  });

  it("rechaza un empleo que no está en la instantánea", () => {
    const cv = cvWith(profileWithBullets(), [
      {
        target: { type: "bullet_order", owner: { type: "experience", experienceId: sampleIds.experience } },
        before: `${react}\n${node}`,
        after: `${node}\n${react}`,
      },
    ]);
    const broken = {
      ...cv,
      suggestions: [
        {
          ...cv.suggestions[0],
          target: {
            type: "bullet_order" as const,
            owner: { type: "experience" as const, experienceId: "71717171-7171-4171-8171-717171717171" },
          },
        },
      ],
    };
    const error = domainFailure(() => profileForRender(broken as TailoredCv));
    expect(error.message).toBe("La sugerencia apunta a un empleo que no está en el perfil.");
  });
});
