import { describe, expect, it } from "vitest";

import { buildAnalyzeJobPrompt } from "./prompt.ts";

describe("buildAnalyzeJobPrompt", () => {
  it("pide copiar la oferta sin traducir y, si hubo un error, lo incluye para el reintento", () => {
    const first = buildAnalyzeJobPrompt("Buscamos a alguien con PostgreSQL.", null);
    expect(first.system).toContain("sin traducir");
    expect(first.system).toContain("sin agregar exigencias");
    expect(first.system).toContain("tecnologías parecidas");
    expect(first.system).toContain("en un solo ítem");
    expect(first.system).toContain("cómo aplicar");
    expect(first.system).toContain("unspecified");
    expect(first.system).toContain("keywordTerms");
    expect(first.user).toBe("Buscamos a alguien con PostgreSQL.");

    const retry = buildAnalyzeJobPrompt("Buscamos a alguien con PostgreSQL.", "kind: valor inválido");
    expect(retry.user).toContain("valor inválido");
    expect(retry.user).toContain("sin agregar datos");
  });
});
