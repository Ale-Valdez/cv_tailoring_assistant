import type { TailoredCv } from "@cv-tailor/contracts";
import { describe, expect, it } from "vitest";

import { bulletOrderBlockLabel } from "./bullet-order-label.ts";

const experienceId = "22222222-2222-4222-8222-222222222222";
const projectId = "55555555-5555-4555-8555-555555555555";

function cv(): TailoredCv {
  return {
    snapshot: {
      experiences: [
        {
          id: experienceId,
          organization: "Analytical Engines",
          role: "Desarrolladora",
        },
      ],
      projects: [{ id: projectId, name: "Motor analítico" }],
    },
  } as TailoredCv;
}

describe("Fase 6.3 - la tarjeta nombra el bloque", () => {
  it("dice el rol y la organización de un empleo", () => {
    expect(bulletOrderBlockLabel(cv(), { type: "experience", experienceId })).toBe(
      "Desarrolladora en Analytical Engines",
    );
  });

  it("dice el nombre del proyecto", () => {
    expect(bulletOrderBlockLabel(cv(), { type: "project", projectId })).toBe("proyecto Motor analítico");
  });

  it("deja un rótulo genérico si el bloque no está en la instantánea", () => {
    expect(
      bulletOrderBlockLabel(cv(), {
        type: "experience",
        experienceId: "71717171-7171-4171-8171-717171717171",
      }),
    ).toBe("Empleo");
    expect(
      bulletOrderBlockLabel(cv(), {
        type: "project",
        projectId: "71717171-7171-4171-8171-717171717172",
      }),
    ).toBe("Proyecto");
  });
});
