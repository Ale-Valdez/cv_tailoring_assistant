import type { Server } from "node:http";

import { ApplicationError } from "@cv-tailor/application";
import type { Express } from "express";
import { describe, expect, it } from "vitest";

import type { AppServices } from "../compose.ts";
import { createServer } from "./create-server.ts";

const posting = {
  id: "12121212-1212-4121-8121-121212121212",
  rawText: "Buscamos TypeScript.",
  title: "Backend",
  company: null,
  language: "es",
  contentHash: "abc",
  requirements: [
    {
      id: "13131313-1313-4131-8131-131313131313",
      text: "Experiencia con TypeScript",
      kind: "technical" as const,
      priority: "required" as const,
    },
  ],
  keywords: [],
} as unknown as Awaited<ReturnType<AppServices["analyzeJobPosting"]>>;

const report = {
  profileId: "11111111-1111-4111-8111-111111111111",
  jobPostingId: posting.id,
  languageNotice: null,
  matchResults: [
    {
      id: "15151515-1515-4151-8151-151515151515",
      requirementId: "13131313-1313-4131-8131-131313131313",
      status: "covered" as const,
      evidenceBulletIds: ["33333333-3333-4333-8333-333333333333"],
      note: null,
    },
  ],
  keywords: [],
  citedBullets: [{ bulletId: "33333333-3333-4333-8333-333333333333", text: "Mantuve APIs en TypeScript." }],
} as unknown as Awaited<ReturnType<AppServices["matchJobPosting"]>>;

function services(overrides: Partial<AppServices> = {}): AppServices {
  return {
    langsmithTracing: false,
    importProfileFromPdf: () => {
      throw new ApplicationError("empty_pdf", "El PDF está vacío.");
    },
    storeConfirmedProfile: () => {
      throw new ApplicationError("profile_not_ready", "El perfil confirmado necesita un nombre.");
    },
    loadConfirmedProfile: async () => null,
    analyzeJobPosting: async () => posting,
    loadLatestJobPosting: async () => null,
    loadJobPosting: async () => posting,
    matchJobPosting: async () => report,
    generateTailoringProposal: async () => {
      throw new ApplicationError("proposal_failed", "No se pudieron proponer cambios.");
    },
    loadTailoringProposal: async () => null,
    reviewSuggestion: async () => {
      throw new ApplicationError("proposal_not_found", "No hay una propuesta con ese identificador.");
    },
    ...overrides,
  };
}

async function withServer(app: Express, run: (url: string) => Promise<void>): Promise<void> {
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Sin puerto.");
  }
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("ofertas", () => {
  it("analiza el texto y rechaza un cuerpo que no es texto", async () => {
    let received = "";
    await withServer(
      createServer(
        services({
          analyzeJobPosting: async (text) => {
            received = text;
            return posting;
          },
        }),
      ),
      async (url) => {
        const missing = await fetch(`${url}/jobs/analyze`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        expect(missing.status).toBe(400);
        expect(await missing.json()).toMatchObject({ code: "invalid_job_text" });

        const response = await fetch(`${url}/jobs/analyze`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "Buscamos TypeScript." }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ id: posting.id, title: "Backend" });
        expect(received).toBe("Buscamos TypeScript.");
      },
    );
  });

  it("informa que todavía no hay una oferta y devuelve la última", async () => {
    await withServer(createServer(services()), async (url) => {
      const missing = await fetch(`${url}/jobs/current`);
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({ code: "job_not_found" });
    });

    await withServer(
      createServer(services({ loadLatestJobPosting: async () => posting })),
      async (url) => {
        const response = await fetch(`${url}/jobs/current`);
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ id: posting.id });
      },
    );
  });

  it("traduce una oferta demasiado larga y la falta de perfil al comparar", async () => {
    await withServer(
      createServer(
        services({
          analyzeJobPosting: async () => {
            throw new ApplicationError("job_text_too_long", "La oferta supera el máximo de 50.000 caracteres.");
          },
          matchJobPosting: async () => {
            throw new ApplicationError("profile_not_found", "Todavía no hay un perfil confirmado.");
          },
        }),
      ),
      async (url) => {
        const tooLong = await fetch(`${url}/jobs/analyze`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "oferta" }),
        });
        expect(tooLong.status).toBe(413);

        const match = await fetch(`${url}/jobs/${posting.id}/match`);
        expect(match.status).toBe(404);
        expect(await match.json()).toMatchObject({ code: "profile_not_found" });
      },
    );
  });

  it("propone cambios, lee la propuesta y revisa una sugerencia", async () => {
    const proposal = {
      id: "abababab-abab-4aba-8aba-abababababab",
      status: "in_review",
      suggestions: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "pending" }],
    };
    let reviewed: unknown = null;
    await withServer(
      createServer(
        services({
          generateTailoringProposal: async () => proposal as Awaited<ReturnType<AppServices["generateTailoringProposal"]>>,
          loadTailoringProposal: async () => proposal as Awaited<ReturnType<AppServices["loadTailoringProposal"]>>,
          reviewSuggestion: async (_cvId, suggestionId, decision) => {
            reviewed = { suggestionId, decision };
            return { ...proposal, status: "final" } as Awaited<ReturnType<AppServices["reviewSuggestion"]>>;
          },
        }),
      ),
      async (url) => {
        const created = await fetch(`${url}/jobs/${posting.id}/proposals`, { method: "POST" });
        expect(created.status).toBe(200);
        expect(await created.json()).toMatchObject({ id: proposal.id, status: "in_review" });

        const current = await fetch(`${url}/jobs/${posting.id}/proposal`);
        expect(current.status).toBe(200);

        const invalid = await fetch(`${url}/proposals/${proposal.id}/suggestions/${proposal.suggestions[0]?.id}/review`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "otra" }),
        });
        expect(invalid.status).toBe(400);
        expect(await invalid.json()).toMatchObject({ code: "invalid_review" });

        const accepted = await fetch(
          `${url}/proposals/${proposal.id}/suggestions/${proposal.suggestions[0]?.id}/review`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ decision: "accept" }),
          },
        );
        expect(accepted.status).toBe(200);
        expect(reviewed).toEqual({
          suggestionId: proposal.suggestions[0]?.id,
          decision: { type: "accept" },
        });
      },
    );
  });

  it("responde 502 si no se pudo proponer y 404 si todavía no hay propuesta", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/jobs/${posting.id}/proposals`, { method: "POST" });
      expect(response.status).toBe(502);
      expect(await response.json()).toMatchObject({
        code: "proposal_failed",
        message: "No se pudieron proponer cambios.",
      });

      const missing = await fetch(`${url}/jobs/${posting.id}/proposal`);
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({ code: "proposal_not_found" });
    });
  });

  it("devuelve el informe de cobertura", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/jobs/${posting.id}/match`);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        jobPostingId: posting.id,
        matchResults: [{ status: "covered" }],
      });
    });
  });
});
