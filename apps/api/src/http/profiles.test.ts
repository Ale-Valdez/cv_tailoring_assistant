import type { Server } from "node:http";

import { confirmReviewedProfile, MAX_JOB_TEXT_CHARS, MAX_PDF_BYTES, ApplicationError } from "@cv-tailor/application";
import type { Express } from "express";
import { describe, expect, it } from "vitest";

import type { AppServices } from "../compose.ts";
import { createServer } from "./create-server.ts";

const readyProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "needs_review" as const,
  contact: {
    name: "Ada Lovelace",
    email: null,
    phone: null,
    location: null,
    links: [],
  },
  summary: null,
  language: "es",
  experiences: [],
  education: [],
  skills: [],
  projects: [],
};

function services(overrides: Partial<AppServices> = {}): AppServices {
  return {
    langsmithTracing: true,
    importProfileFromPdf: () => {
      throw new ApplicationError("empty_pdf", "El PDF está vacío.");
    },
    storeConfirmedProfile: async (value: unknown) => confirmReviewedProfile(value),
    loadConfirmedProfile: async () => null,
    analyzeJobPosting: async () => {
      throw new ApplicationError("empty_job_text", "La oferta está vacía.");
    },
    loadLatestJobPosting: async () => null,
    loadJobPosting: async () => {
      throw new ApplicationError("job_not_found", "No hay una oferta con ese identificador.");
    },
    matchJobPosting: async () => {
      throw new ApplicationError("profile_not_found", "Todavía no hay un perfil confirmado.");
    },
    generateTailoringProposal: async () => {
      throw new ApplicationError("proposal_failed", "No se pudieron proponer cambios.");
    },
    loadTailoringProposal: async () => null,
    previewTailoredCv: async () => "<html></html>",
    exportTailoredCv: async () => {
      throw new ApplicationError("export_not_ready", "Quedan sugerencias sin revisar.");
    },
    loadTailoredCvExport: async () => {
      throw new ApplicationError("export_not_found", "No hay un PDF con esa versión.");
    },
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

describe("perfiles", () => {
  it("informa si LangSmith está activo y el tope del PDF", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/privacy`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        langsmithTracing: true,
        maxPdfBytes: MAX_PDF_BYTES,
        maxJobTextChars: MAX_JOB_TEXT_CHARS,
      });
    });
  });

  it("rechaza una importación que no es PDF", async () => {
    let calls = 0;
    await withServer(
      createServer(
        services({
          importProfileFromPdf: () => {
            calls += 1;
            throw new ApplicationError("empty_pdf", "El PDF está vacío.");
          },
        }),
      ),
      async (url) => {
        const response = await fetch(`${url}/profiles/import`, {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: "hola",
        });
        expect(response.status).toBe(415);
        expect(await response.json()).toMatchObject({ code: "unsupported_media_type" });
        expect(calls).toBe(0);
      },
    );
  });

  it("traduce un PDF vacío a 422", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/profiles/import`, {
        method: "POST",
        headers: { "content-type": "application/pdf" },
        body: Buffer.from("%PDF"),
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ code: "empty_pdf" });
    });
  });

  it("rechaza un PDF de más de 10 MiB antes de llamar al caso de uso", async () => {
    let calls = 0;
    await withServer(
      createServer(
        services({
          importProfileFromPdf: () => {
            calls += 1;
            throw new Error("no debería importar");
          },
        }),
      ),
      async (url) => {
        const response = await fetch(`${url}/profiles/import`, {
          method: "POST",
          headers: { "content-type": "application/pdf" },
          body: Buffer.alloc(MAX_PDF_BYTES + 1, 1),
        });
        expect(response.status).toBe(413);
        expect(await response.json()).toMatchObject({ code: "pdf_too_large" });
        expect(calls).toBe(0);
      },
    );
  });

  it("traduce un fallo del extractor a 502", async () => {
    await withServer(
      createServer(
        services({
          importProfileFromPdf: () => {
            throw new ApplicationError("extraction_failed", "No se pudo estructurar el CV.");
          },
        }),
      ),
      async (url) => {
        const response = await fetch(`${url}/profiles/import`, {
          method: "POST",
          headers: { "content-type": "application/pdf" },
          body: Buffer.from("%PDF"),
        });
        expect(response.status).toBe(502);
        expect(await response.json()).toMatchObject({ code: "extraction_failed" });
      },
    );
  });

  it("confirma un perfil listo", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/profiles/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(readyProfile),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: "confirmed", contact: { name: "Ada Lovelace" } });
    });
  });

  it("rechaza confirmar un perfil sin nombre", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/profiles/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...readyProfile,
          contact: { ...readyProfile.contact, name: "" },
        }),
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ code: "profile_not_ready" });
    });
  });

  it("devuelve el perfil confirmado y 404 si todavía no hay", async () => {
    let stored: unknown = null;
    await withServer(
      createServer(
        services({
          storeConfirmedProfile: async (value: unknown) => {
            stored = confirmReviewedProfile(value);
            return stored as Awaited<ReturnType<AppServices["storeConfirmedProfile"]>>;
          },
          loadConfirmedProfile: async () => {
            if (stored === null) {
              return null;
            }
            return stored as Awaited<ReturnType<AppServices["loadConfirmedProfile"]>>;
          },
        }),
      ),
      async (url) => {
        const missing = await fetch(`${url}/profiles/current`);
        expect(missing.status).toBe(404);
        expect(await missing.json()).toMatchObject({ code: "profile_not_found" });

        const saved = await fetch(`${url}/profiles/confirm`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(readyProfile),
        });
        expect(saved.status).toBe(200);

        const current = await fetch(`${url}/profiles/current`);
        expect(current.status).toBe(200);
        expect(await current.json()).toMatchObject({ status: "confirmed", contact: { name: "Ada Lovelace" } });
      },
    );
  });

  it("rechaza JSON inválido", async () => {
    await withServer(createServer(services()), async (url) => {
      const response = await fetch(`${url}/profiles/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "invalid_json" });
    });
  });
});
