import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import {
  bulletIdSchema,
  createMatchResultId,
  jobPostingIdSchema,
  keywordIdSchema,
  profileIdSchema,
  type BulletId,
} from "../ids.ts";
import type { JobPosting } from "../job/job-posting.ts";
import type { Keyword } from "../job/keyword.ts";
import { canonicalTerm, containsTerm, foldTerm } from "../job/normalize-keywords.ts";
import type { Requirement } from "../job/requirement.ts";
import { parseSchema } from "../parse.ts";
import type { ConfirmedProfile } from "../profile/profile.ts";
import { blankToNull, requiredText } from "../text.ts";
import { CATEGORY_EQUIVALENCES } from "./category-equivalences.ts";
import { matchResultSchema, type MatchResult, type MatchStatus } from "./match-result.ts";

const STOPWORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "al",
  "y",
  "o",
  "u",
  "en",
  "con",
  "por",
  "para",
  "que",
  "se",
  "su",
  "sus",
  "es",
  "son",
  "como",
  "mas",
  "sobre",
  "entre",
  "hacia",
  "desde",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "a",
  "ante",
  "bajo",
  "sin",
  "tras",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "an",
  "as",
  "at",
  "by",
  "from",
  "our",
  "your",
  "their",
  "be",
  "is",
  "are",
  "this",
  "that",
  "experiencia",
  "experience",
  "anos",
  "years",
  "year",
  "conocimiento",
  "conocimientos",
  "knowledge",
  "habilidad",
  "habilidades",
  "skills",
  "skill",
  "ability",
  "abilities",
  "buen",
  "buena",
  "buenos",
  "good",
  "strong",
  "solida",
  "nivel",
  "level",
  "manejo",
  "uso",
  "using",
  "plus",
  "deseable",
  "obligatorio",
  "required",
  "preferred",
  "nice",
  "have",
]);

const LANGUAGE_KEYS: Record<string, string> = {
  es: "es",
  espanol: "es",
  spanish: "es",
  castellano: "es",
  en: "en",
  ingles: "en",
  english: "en",
  pt: "pt",
  portugues: "pt",
  portuguese: "pt",
};

const LANGUAGE_LABELS: Record<string, string> = {
  es: "español",
  en: "inglés",
  pt: "portugués",
};

export const keywordCoverageSchema = z.strictObject({
  keywordId: keywordIdSchema,
  canonical: requiredText("La cobertura necesita el término canónico."),
  present: z.boolean(),
  evidenceBulletIds: z.array(bulletIdSchema),
  skillNames: z.array(requiredText("El nombre de la habilidad no puede estar vacío.")),
});

export type KeywordCoverage = z.infer<typeof keywordCoverageSchema>;

export const citedBulletSchema = z.strictObject({
  bulletId: bulletIdSchema,
  text: requiredText("El bullet citado necesita texto."),
});

export type CitedBullet = z.infer<typeof citedBulletSchema>;

export const jobMatchReportSchema = z
  .strictObject({
    profileId: profileIdSchema,
    jobPostingId: jobPostingIdSchema,
    languageNotice: blankToNull,
    linksNotice: blankToNull,
    matchResults: z.array(matchResultSchema),
    keywords: z.array(keywordCoverageSchema),
    citedBullets: z.array(citedBulletSchema),
  })
  .superRefine((report, ctx) => {
    if (repeatedValues(report.citedBullets.map((item) => item.bulletId)).length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Hay bullets citados repetidos.",
        path: ["citedBullets"],
      });
    }
    const cited = new Set(report.citedBullets.map((item) => item.bulletId));
    const used = [
      ...report.matchResults.flatMap((item) => item.evidenceBulletIds),
      ...report.keywords.flatMap((item) => item.evidenceBulletIds),
    ];
    if (used.some((bulletId) => !cited.has(bulletId))) {
      ctx.addIssue({
        code: "custom",
        message: "Falta el texto de un bullet citado.",
        path: ["citedBullets"],
      });
    }
  });

export type JobMatchReport = z.infer<typeof jobMatchReportSchema>;

type BulletOrigin = "experience" | "project";

interface ProfileBullet {
  id: BulletId;
  text: string;
  origin: BulletOrigin;
}

export function matchProfileToJob(profile: ConfirmedProfile, job: JobPosting): JobMatchReport {
  const bullets = profileBullets(profile);
  const skillNames = profile.skills.map((skill) => skill.name);
  const otherText = otherCorpus(profile);
  const matchResults = job.requirements.map((requirement) =>
    matchRequirement(requirement, job.keywords, bullets, skillNames),
  );
  const keywords = job.keywords.map((keyword) => coverKeyword(keyword, bullets, skillNames, otherText));
  return parseSchema(jobMatchReportSchema, {
    profileId: profile.id,
    jobPostingId: job.id,
    languageNotice: languageNotice(profile.language, job.language),
    linksNotice: linksNotice(job.rawText, profile.contact.links.length),
    matchResults,
    keywords,
    citedBullets: citedBullets(bullets, matchResults, keywords),
  });
}

interface CategoryHit {
  label: string;
  evidenceTerms: string[];
  bulletIds: BulletId[];
  origins: BulletOrigin[];
  phraseTokens: Set<string>;
}

function matchRequirement(
  requirement: Requirement,
  keywords: readonly Keyword[],
  bullets: readonly ProfileBullet[],
  skillNames: readonly string[],
): MatchResult {
  const hits = categoryHits(requirement, bullets);
  const signals = signalsFor(requirement, keywords);
  if (signals.length === 0 && hits.length === 0) {
    return result(requirement, "gap", [], "El requisito no tiene términos comparables.");
  }
  const matched = signals.filter((signal) => bullets.some((bullet) => bulletHasSignal(bullet.text, signal, keywords)));
  const lexicalEvidence = bullets
    .filter((bullet) => matched.some((signal) => bulletHasSignal(bullet.text, signal, keywords)))
    .map((bullet) => bullet.id);
  if (signals.length > 0 && matched.length === signals.length) {
    return result(requirement, "covered", lexicalEvidence, null);
  }
  if (hits.length === 0) {
    const missing = signals.filter((signal) => !matched.includes(signal));
    const skillText = skillNote(skillsForSignals(missing, keywords, skillNames));
    if (matched.length > 0) {
      const missingText = `Falta evidencia en bullets de: ${joinSpanish(missing)}.`;
      return result(requirement, "partial", lexicalEvidence, joinNote(missingText, skillText));
    }
    return result(requirement, "gap", [], skillText ?? "Sin evidencia en el perfil.");
  }
  const missing = signals.filter((signal) => !matched.includes(signal) && !explainedByCategory(signal, hits));
  const categoryEvidence = bullets
    .filter((bullet) => hits.some((hit) => hit.bulletIds.includes(bullet.id)))
    .map((bullet) => bullet.id);
  const evidence = uniqueBulletIds([...lexicalEvidence, ...categoryEvidence]);
  const missingText = missing.length > 0 ? `Falta evidencia en bullets de: ${joinSpanish(missing)}.` : null;
  const note = joinNotes(missingText, categoryNote(hits), skillNote(skillsForSignals(missing, keywords, skillNames)));
  if (evidence.length > 0) {
    return result(requirement, "partial", evidence, note);
  }
  return result(requirement, "gap", [], note.length > 0 ? note : "Sin evidencia en el perfil.");
}

function categoryHits(requirement: Requirement, bullets: readonly ProfileBullet[]): CategoryHit[] {
  const hits: CategoryHit[] = [];
  for (const row of CATEGORY_EQUIVALENCES) {
    const phrases = row.requirementPhrases.filter((phrase) => containsTerm(requirement.text, phrase));
    if (phrases.length === 0) {
      continue;
    }
    const evidenceTerms = row.evidencePhrases.filter((phrase) =>
      bullets.some((bullet) => containsTerm(bullet.text, phrase)),
    );
    if (evidenceTerms.length === 0) {
      continue;
    }
    const matched = bullets.filter((bullet) => evidenceTerms.some((phrase) => containsTerm(bullet.text, phrase)));
    const origins: BulletOrigin[] = [];
    for (const bullet of matched) {
      if (!origins.includes(bullet.origin)) {
        origins.push(bullet.origin);
      }
    }
    hits.push({
      label: row.label,
      evidenceTerms,
      bulletIds: matched.map((bullet) => bullet.id),
      origins,
      phraseTokens: new Set(phrases.flatMap((phrase) => foldTerm(phrase).split(" "))),
    });
  }
  return hits;
}

function explainedByCategory(signal: string, hits: readonly CategoryHit[]): boolean {
  const tokens = foldTerm(signal).split(" ").filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return false;
  }
  return hits.some((hit) => tokens.every((token) => hit.phraseTokens.has(token)));
}

function categoryNote(hits: readonly CategoryHit[]): string {
  return hits.map((hit) => formatCategoryHit(hit)).join(" ");
}

function formatCategoryHit(hit: CategoryHit): string {
  const quoted = hit.evidenceTerms.map((term) => `«${term}»`);
  const origin = joinSpanish(hit.origins.map((item) => (item === "experience" ? "en un empleo" : "en un proyecto")));
  if (quoted.length === 1) {
    return `${quoted[0]}, ${origin}, respalda la categoría «${hit.label}» y no alcanza para cubrir el requisito.`;
  }
  return `${joinSpanish(quoted)}, ${origin}, respaldan la categoría «${hit.label}» y no alcanzan para cubrir el requisito.`;
}

function coverKeyword(
  keyword: Keyword,
  bullets: readonly ProfileBullet[],
  skillNames: readonly string[],
  otherText: string,
): KeywordCoverage {
  const forms = formsFor(keyword.canonical, [keyword]);
  const evidenceBulletIds = bullets
    .filter((bullet) => forms.some((form) => containsTerm(bullet.text, form)))
    .map((bullet) => bullet.id);
  const matchedSkills = skillNames.filter((skill) => forms.some((form) => containsTerm(skill, form)));
  const inOtherText = forms.some((form) => containsTerm(otherText, form));
  return {
    keywordId: keyword.id,
    canonical: keyword.canonical,
    present: evidenceBulletIds.length > 0 || matchedSkills.length > 0 || inOtherText,
    evidenceBulletIds,
    skillNames: matchedSkills,
  };
}

function signalsFor(requirement: Requirement, keywords: readonly Keyword[]): string[] {
  // Fase 3 (ADR-027): si el análisis ya dejó explícita la relación con una
  // keyword, esa relación vale como señal aunque el texto del requisito no
  // repita el término literal. Es aditivo: un requisito guardado antes de la
  // Fase 3 no tiene `keywordIds` y sigue dependiendo solo del texto.
  const fromExplicitKeywords = requirement.keywordIds
    .map((keywordId) => keywords.find((keyword) => keyword.id === keywordId))
    .filter((keyword): keyword is Keyword => keyword !== undefined)
    .map((keyword) => keyword.canonical);
  const fromTextKeywords = keywords
    .filter((keyword) => formsFor(keyword.canonical, [keyword]).some((form) => containsTerm(requirement.text, form)))
    .map((keyword) => keyword.canonical);
  const fromKeywords = unique([...fromExplicitKeywords, ...fromTextKeywords]);
  const covered = new Set(fromKeywords.flatMap((signal) => formsFor(signal, keywords).flatMap((form) => foldTerm(form).split(" "))));
  const tokens = foldTerm(requirement.text)
    .split(" ")
    .filter((token) => keepToken(token) && !covered.has(token))
    .map((token) => canonicalTerm(token).canonical);
  return unique(fromKeywords.concat(tokens));
}

function keepToken(token: string): boolean {
  if (STOPWORDS.has(token)) {
    return false;
  }
  if (canonicalTerm(token).aliases.length > 0) {
    return true;
  }
  if (token.length >= 3) {
    return true;
  }
  return /[#+\d]/.test(token);
}

function formsFor(signal: string, keywords: readonly Keyword[]): string[] {
  const keyword = keywords.find((item) => foldTerm(item.canonical) === foldTerm(signal));
  if (keyword !== undefined) {
    const resolved = canonicalTerm(keyword.canonical);
    return unique([keyword.canonical, ...keyword.aliases, ...resolved.aliases]);
  }
  const resolved = canonicalTerm(signal);
  return unique([resolved.canonical, ...resolved.aliases, signal]);
}

function bulletHasSignal(text: string, signal: string, keywords: readonly Keyword[]): boolean {
  return formsFor(signal, keywords).some((form) => containsTerm(text, form));
}

function skillsForSignals(signals: readonly string[], keywords: readonly Keyword[], skillNames: readonly string[]): string[] {
  return skillNames.filter((skill) =>
    signals.some((signal) => formsFor(signal, keywords).some((form) => containsTerm(skill, form))),
  );
}

function result(
  requirement: Requirement,
  status: MatchStatus,
  evidenceBulletIds: BulletId[],
  note: string | null,
): MatchResult {
  return parseSchema(matchResultSchema, {
    id: createMatchResultId(),
    requirementId: requirement.id,
    status,
    evidenceBulletIds,
    note,
  });
}

function profileBullets(profile: ConfirmedProfile): ProfileBullet[] {
  return [
    ...profile.experiences.flatMap((experience) =>
      experience.bullets.map((bullet) => ({ id: bullet.id, text: bullet.text, origin: "experience" as const })),
    ),
    ...profile.projects.flatMap((project) =>
      project.bullets.map((bullet) => ({ id: bullet.id, text: bullet.text, origin: "project" as const })),
    ),
  ];
}

function otherCorpus(profile: ConfirmedProfile): string {
  return [
    profile.summary ?? "",
    ...profile.experiences.flatMap((experience) => [experience.organization, experience.role]),
    ...profile.education.flatMap((education) => [education.institution, education.title]),
    ...profile.projects.flatMap((project) => [project.name, project.description ?? ""]),
  ].join("\n");
}

function citedBullets(
  bullets: readonly ProfileBullet[],
  results: readonly MatchResult[],
  keywords: readonly KeywordCoverage[],
): CitedBullet[] {
  const used = new Set<BulletId>([
    ...results.flatMap((item) => item.evidenceBulletIds),
    ...keywords.flatMap((item) => item.evidenceBulletIds),
  ]);
  return bullets.filter((bullet) => used.has(bullet.id)).map((bullet) => ({ bulletId: bullet.id, text: bullet.text }));
}

const LINKS_NOTICE =
  "La oferta pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces.";

const LINK_REQUEST_PHRASES = ["portfolio", "portafolio", "enlace a github", "link to github", "github link"];

function linksNotice(rawText: string, linkCount: number): string | null {
  if (linkCount > 0) {
    return null;
  }
  const folded = ` ${foldTerm(rawText)} `;
  const asked = LINK_REQUEST_PHRASES.some((phrase) => folded.includes(` ${phrase} `));
  return asked ? LINKS_NOTICE : null;
}

function languageNotice(profileLanguage: string, jobLanguage: string | null): string | null {
  if (jobLanguage === null || sameLanguage(profileLanguage, jobLanguage)) {
    return null;
  }
  return `La oferta está en ${languageLabel(jobLanguage)} y el perfil en ${languageLabel(profileLanguage)}. El informe compara términos sin traducir.`;
}

function sameLanguage(left: string, right: string): boolean {
  return languageKey(left) === languageKey(right);
}

function languageKey(value: string): string {
  const folded = foldTerm(value);
  return LANGUAGE_KEYS[folded] ?? folded;
}

function languageLabel(value: string): string {
  return LANGUAGE_LABELS[languageKey(value)] ?? value.trim();
}

function skillNote(names: readonly string[]): string | null {
  if (names.length === 0) {
    return null;
  }
  if (names.length === 1) {
    return `La habilidad «${names[0]}» está en el perfil, sin un bullet que la respalde.`;
  }
  const quoted = names.map((name) => `«${name}»`);
  return `Las habilidades ${joinSpanish(quoted)} están en el perfil, sin un bullet que las respalde.`;
}

function joinNote(left: string, right: string | null): string {
  return right === null ? left : `${left} ${right}`;
}

function joinNotes(...parts: Array<string | null>): string {
  return parts.filter((part): part is string => part !== null && part.length > 0).join(" ");
}

function uniqueBulletIds(ids: readonly BulletId[]): BulletId[] {
  const seen = new Set<BulletId>();
  const unique: BulletId[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

function joinSpanish(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const resultValues: string[] = [];
  for (const value of values) {
    const key = foldTerm(value);
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    resultValues.push(value);
  }
  return resultValues;
}
