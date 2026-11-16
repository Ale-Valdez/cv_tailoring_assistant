import {
  createJobPostingId,
  createKeywordId,
  createRequirementId,
  DomainError,
  foldTerm,
  normalizeKeywordDrafts,
  parseJobPosting,
  type JobPosting,
  type KeywordId,
} from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { ExtractedJobContent, ExtractedRequirement, JobAnalyzer } from "../ports/job-analyzer.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";

export const MAX_JOB_TEXT_CHARS = 50_000;

export interface AnalyzeJobPostingDeps {
  jobAnalyzer: JobAnalyzer;
  jobPostings: JobPostingRepository;
}

export async function analyzeJobPosting(deps: AnalyzeJobPostingDeps, rawText: string): Promise<JobPosting> {
  const text = rawText.trim();
  if (text.length === 0) {
    throw new ApplicationError("empty_job_text", "La oferta está vacía.");
  }
  if (text.length > MAX_JOB_TEXT_CHARS) {
    throw new ApplicationError(
      "job_text_too_long",
      `La oferta supera el máximo de ${new Intl.NumberFormat("es-AR").format(MAX_JOB_TEXT_CHARS)} caracteres.`,
    );
  }

  const contentHash = await hashJobText(text);
  const existing = await deps.jobPostings.findByContentHash(contentHash);
  if (existing !== null) {
    return existing;
  }

  const extracted = await deps.jobAnalyzer.analyze(text);
  try {
    const posting = postingFromExtraction(text, contentHash, extracted);
    await deps.jobPostings.save(posting);
    return posting;
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_job", error.message, error);
    }
    throw error;
  }
}

function postingFromExtraction(text: string, contentHash: string, extracted: ExtractedJobContent): JobPosting {
  const keywords = normalizeKeywordDrafts(extracted.keywords).map((keyword) => ({
    id: createKeywordId(),
    canonical: keyword.canonical,
    aliases: keyword.aliases,
    frequency: keyword.frequency,
    origin: keyword.origin,
  }));
  return parseJobPosting({
    id: createJobPostingId(),
    rawText: text,
    title: extracted.title,
    company: extracted.company,
    language: extracted.language,
    contentHash,
    requirements: uniqueRequirements(extracted.requirements).map((requirement) => ({
      id: createRequirementId(),
      text: requirement.text,
      kind: requirement.kind,
      priority: requirement.priority,
      keywordIds: resolveKeywordIds(requirement.keywordTerms ?? [], keywords),
    })),
    keywords,
  });
}

// Fase 3 (ADR-027): el modelo cita una keyword de este requisito por su
// término (canónico o alias). Se resuelve contra la lista ya deduplicada,
// así que un alias conocido por el diccionario (p.ej. «Postgres») resuelve a
// la keyword final («PostgreSQL») aunque el modelo no haya usado ese nombre.
// Un término que no está en `keywords` se descarta: no se inventa una
// keyword nueva solo porque la citó un requisito.
function resolveKeywordIds(
  terms: readonly string[],
  keywords: readonly { id: KeywordId; canonical: string; aliases: readonly string[] }[],
): KeywordId[] {
  const ids: KeywordId[] = [];
  for (const term of terms) {
    const folded = foldTerm(term);
    if (folded.length === 0) {
      continue;
    }
    const match = keywords.find(
      (keyword) => foldTerm(keyword.canonical) === folded || keyword.aliases.some((alias) => foldTerm(alias) === folded),
    );
    if (match !== undefined && !ids.includes(match.id)) {
      ids.push(match.id);
    }
  }
  return ids;
}

function uniqueRequirements(requirements: readonly ExtractedRequirement[]): ExtractedRequirement[] {
  const seen = new Set<string>();
  const unique: ExtractedRequirement[] = [];
  for (const requirement of requirements) {
    const text = requirement.text.trim().replace(/\s+/g, " ");
    const key = foldTerm(text);
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push({ ...requirement, text });
  }
  return unique;
}

async function hashJobText(text: string): Promise<string> {
  const cryptoApi = (globalThis as { crypto?: SubtleCryptoLike }).crypto;
  const Encoder = (globalThis as { TextEncoder?: new () => { encode(input: string): Uint8Array } }).TextEncoder;
  if (cryptoApi === undefined || Encoder === undefined) {
    throw new Error("Este entorno no puede calcular el hash de la oferta.");
  }
  const digest = await cryptoApi.subtle.digest("SHA-256", new Encoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface SubtleCryptoLike {
  subtle: {
    digest(algorithm: "SHA-256", data: Uint8Array): Promise<ArrayBuffer>;
  };
}
