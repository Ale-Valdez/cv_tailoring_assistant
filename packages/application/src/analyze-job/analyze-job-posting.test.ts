import type { JobPosting, JobPostingId } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import type { ExtractedJobContent, JobAnalyzer } from "../ports/job-analyzer.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import { analyzeJobPosting, MAX_JOB_TEXT_CHARS } from "./analyze-job-posting.ts";

function analyzerReturning(content: ExtractedJobContent): JobAnalyzer & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async analyze(rawText) {
      calls.push(rawText);
      return content;
    },
  };
}

function memoryJobs(): JobPostingRepository & { rows: JobPosting[] } {
  const rows: JobPosting[] = [];
  return {
    rows,
    async save(posting) {
      const index = rows.findIndex((row) => row.id === posting.id);
      if (index === -1) {
        rows.push(posting);
        return;
      }
      rows[index] = posting;
    },
    async findById(id: JobPostingId) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByContentHash(contentHash: string) {
      return rows.find((row) => row.contentHash === contentHash) ?? null;
    },
    async findLatest() {
      return rows.at(-1) ?? null;
    },
  };
}

function extractedJob(): ExtractedJobContent {
  return {
    title: " Backend ",
    company: "",
    language: "es",
    requirements: [
      { text: "  Mantener APIs en Postgres  ", kind: "technical", priority: "required" },
      { text: "Mantener APIs en Postgres", kind: "functional", priority: "preferred" },
      { text: "   ", kind: "technical", priority: "required" },
    ],
    keywords: [
      { canonical: "Postgres", aliases: ["Java"], frequency: 2, origin: "requisitos" },
      { canonical: "postgres", aliases: [], frequency: 1, origin: "título" },
    ],
  };
}

function applicationFailure(run: () => Promise<unknown>): Promise<ApplicationError> {
  return run().then(
    () => {
      throw new Error("Se esperaba un ApplicationError.");
    },
    (error: unknown) => {
      if (error instanceof ApplicationError) {
        return error;
      }
      throw error;
    },
  );
}

describe("analyzeJobPosting", () => {
  it("guarda la oferta normalizada y no vuelve a llamar al modelo si el texto se repite", async () => {
    const jobAnalyzer = analyzerReturning(extractedJob());
    const jobPostings = memoryJobs();

    const first = await analyzeJobPosting({ jobAnalyzer, jobPostings }, "  Buscamos a alguien con Postgres.  ");
    const second = await analyzeJobPosting({ jobAnalyzer, jobPostings }, "Buscamos a alguien con Postgres.");

    expect(jobAnalyzer.calls).toEqual(["Buscamos a alguien con Postgres."]);
    expect(second).toBe(first);
    expect(first.rawText).toBe("Buscamos a alguien con Postgres.");
    expect(first.title).toBe("Backend");
    expect(first.company).toBeNull();
    expect(first.requirements).toHaveLength(1);
    expect(first.requirements[0]?.text).toBe("Mantener APIs en Postgres");
    expect(first.keywords.map((keyword) => keyword.canonical)).toEqual(["PostgreSQL"]);
    expect(first.keywords[0]?.aliases).toEqual(["Postgres", "Postgre SQL"]);
    expect(first.keywords[0]?.frequency).toBe(3);
    expect(first.contentHash).toHaveLength(64);
  });

  it("rechaza una oferta vacía o demasiado larga sin llamar al modelo", async () => {
    const jobAnalyzer = analyzerReturning(extractedJob());
    const jobPostings = memoryJobs();
    const empty = await applicationFailure(() => analyzeJobPosting({ jobAnalyzer, jobPostings }, "   "));
    const tooLong = await applicationFailure(() =>
      analyzeJobPosting({ jobAnalyzer, jobPostings }, "a".repeat(MAX_JOB_TEXT_CHARS + 1)),
    );

    expect(empty).toMatchObject({ code: "empty_job_text" });
    expect(tooLong.code).toBe("job_text_too_long");
    expect(tooLong.message).toBe(
      `La oferta supera el máximo de ${new Intl.NumberFormat("es-AR").format(MAX_JOB_TEXT_CHARS)} caracteres.`,
    );
    expect(jobAnalyzer.calls).toHaveLength(0);
  });

  // Fase 3 del plan de auditoría (ADR-027): el requisito cita la keyword por
  // su término, y se resuelve al id final aunque el término sea un alias de
  // diccionario distinto del canonical ya deduplicado («Postgres» -> «PostgreSQL»).
  it("resuelve keywordTerms a keywordIds, incluso por alias, y descarta un término que no está en keywords", async () => {
    const jobAnalyzer = analyzerReturning({
      title: "Backend",
      company: "Ejemplo",
      language: "es",
      requirements: [
        {
          text: "Mantener APIs en Postgres",
          kind: "technical",
          priority: "required",
          keywordTerms: ["Postgres", "SQS"],
        },
      ],
      keywords: [{ canonical: "PostgreSQL", aliases: ["Postgres"], frequency: 1, origin: "requisitos" }],
    });
    const jobPostings = memoryJobs();

    const posting = await analyzeJobPosting({ jobAnalyzer, jobPostings }, "Buscamos a alguien con Postgres.");

    expect(posting.requirements[0]?.keywordIds).toEqual([posting.keywords[0]?.id]);
  });

  it("traduce un borrador inválido del analizador", async () => {
    const jobAnalyzer = analyzerReturning({
      ...extractedJob(),
      keywords: [{ canonical: "TypeScript", aliases: [], frequency: -1, origin: "requisitos" }],
    });
    const error = await applicationFailure(() => analyzeJobPosting({ jobAnalyzer, jobPostings: memoryJobs() }, "Oferta"));

    expect(error.code).toBe("invalid_job");
    expect(error.message).toContain("frecuencia");
  });
});
