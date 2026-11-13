import { describe, expect, it } from "vitest";

import { buildExtractProfilePrompt } from "./prompt.ts";

describe("buildExtractProfilePrompt", () => {
  it("pide copiar el texto y, si hubo un error, lo incluye para el reintento", () => {
    const first = buildExtractProfilePrompt("Experiencia en TypeScript desde 2020.", null);
    expect(first.system).toContain("sin traducir");
    expect(first.system).toContain("No inventes");
    expect(first.system).toContain("email");
    expect(first.user).toBe("Experiencia en TypeScript desde 2020.");

    const retry = buildExtractProfilePrompt("Experiencia en TypeScript desde 2020.", "end: fecha inválida");
    expect(retry.user).toContain("fecha inválida");
    expect(retry.user).toContain("sin agregar datos");
  });
});
