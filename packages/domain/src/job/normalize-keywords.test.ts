import { describe, expect, it } from "vitest";

import { normalizeKeywordDrafts } from "./normalize-keywords.ts";

describe("normalizeKeywordDrafts", () => {
  it("une alias del diccionario y suma la frecuencia", () => {
    const keywords = normalizeKeywordDrafts([
      { canonical: "Postgres", aliases: ["Postgre SQL"], frequency: 2, origin: "requisitos" },
      { canonical: "postgresql", aliases: [], frequency: 1, origin: "título" },
      { canonical: "JS", aliases: ["Java"], frequency: 1, origin: "requisitos" },
      { canonical: "Java", aliases: [], frequency: 1, origin: "requisitos" },
    ]);

    expect(keywords).toEqual([
      {
        canonical: "PostgreSQL",
        aliases: ["Postgres", "Postgre SQL"],
        frequency: 3,
        origin: "requisitos, título",
      },
      {
        canonical: "JavaScript",
        aliases: ["JS"],
        frequency: 1,
        origin: "requisitos",
      },
      {
        canonical: "Java",
        aliases: [],
        frequency: 1,
        origin: "requisitos",
      },
    ]);
  });

  it("conserva un término desconocido y descarta canónicos vacíos", () => {
    const keywords = normalizeKeywordDrafts([
      { canonical: "  Fastify  ", aliases: ["fastify", ""], frequency: 1, origin: "  " },
      { canonical: "   ", aliases: ["Nada"], frequency: 4, origin: "requisitos" },
    ]);

    expect(keywords).toEqual([
      { canonical: "Fastify", aliases: [], frequency: 1, origin: "oferta" },
    ]);
  });
});
