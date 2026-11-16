import type { JobPosting } from "../job/job-posting.ts";
import { ALIAS_GROUPS } from "../job/keyword-aliases.ts";
import { containsTerm, dictionaryCanonical, foldTerm } from "../job/normalize-keywords.ts";
import type { ProfileForModel } from "../profile/profile.ts";
import { CATEGORY_EQUIVALENCES } from "./category-equivalences.ts";
import {
  assessBulletOrder,
  bulletOrderContainer,
  suggestionFitProblems,
  type BulletOrderOwner,
  type EvidenceRef,
  type SuggestionTarget,
  type SuggestionValidation,
} from "./suggestion.ts";

export interface FabricationDraft {
  target: SuggestionTarget;
  after: string;
  evidence: EvidenceRef[];
}

const COMMON = new Set(
  [
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
    "más",
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
    "años",
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
    "buscamos",
    "estamos",
    "ofrece",
    "ofrecemos",
    "requisitos",
    "requerimos",
    "responsabilidades",
    "funciones",
    "busca",
    "buscar",
    "valoramos",
    "candidato",
    "candidata",
    "puesto",
    "modalidad",
    "beneficios",
    "mantuve",
    "sostuve",
    "desarrollé",
    "diseñé",
    "lideré",
    "implementé",
    "construí",
    "mejoré",
    "colaboré",
    "participé",
    "automaticé",
    "migré",
    "reduje",
    "aumenté",
    "creé",
    "coordiné",
    "documenté",
    "integré",
    "optimicé",
    "publiqué",
    "escribí",
    "trabajé",
    "ayudé",
    "definí",
    "desplegué",
    "configuré",
    "monitoreé",
    "resolví",
    "entregué",
    "lancé",
    "escalé",
    "reescribí",
    "adapté",
    "usé",
    "use",
    "developed",
    "designed",
    "led",
    "built",
    "improved",
    "maintained",
    "created",
    "reduced",
    "increased",
    "implemented",
    "collaborated",
    "delivered",
    "managed",
    "wrote",
    "migrated",
    "automated",
    "supported",
    "equipo",
    "equipos",
    "servicio",
    "servicios",
    "sistema",
    "sistemas",
    "proyecto",
    "proyectos",
    "cliente",
    "clientes",
    "proceso",
    "procesos",
    "calidad",
    "usuario",
    "usuarios",
    "negocio",
    "mejora",
    "mejoras",
    "plataforma",
    "plataformas",
    "producto",
    "productos",
    "aplicación",
    "aplicaciones",
    "dato",
    "datos",
    "información",
    "resultado",
    "resultados",
    "tiempo",
    "trabajo",
    "trabajos",
    "parte",
    "partes",
    "base",
    "entorno",
    "producción",
    "desarrollo",
    "mantenimiento",
    "soporte",
    "rendimiento",
    "latencia",
    "disponibilidad",
    "seguridad",
    "forma",
    "manera",
    "solución",
    "soluciones",
    "cambio",
    "cambios",
    "versión",
    "versiones",
    "flujo",
    "flujos",
    "objetivo",
    "objetivos",
    "impacto",
    "alcance",
    "durante",
    "además",
    "también",
    "dentro",
    "fuera",
    "alto",
    "alta",
    "mayor",
    "menor",
    "principal",
    "principales",
    "interno",
    "interna",
    "nuevo",
    "nueva",
    "nuevos",
    "nuevas",
    "usando",
    "mediante",
    "través",
  ].map((word) => foldTerm(word)),
);

const TOKEN = /\.?[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu;

export function checkFabrication(
  profile: ProfileForModel,
  job: JobPosting,
  draft: FabricationDraft,
): Exclude<SuggestionValidation, { outcome: "not_checked" }> {
  const after = draft.after.trim();
  if (after.length === 0) {
    return { outcome: "invalid", reasons: ["La sugerencia necesita un texto resultante."] };
  }
  if (draft.evidence.length === 0) {
    return { outcome: "invalid", reasons: ["La sugerencia tiene que citar evidencia del perfil."] };
  }

  const reasons = [
    ...fitReasons(profile, { ...draft, after }),
    ...citationReasons(profile, draft),
  ];
  if (draft.target.type === "skill_order") {
    reasons.push(...skillOrderReasons(profile, after));
  } else if (draft.target.type === "bullet_order") {
    reasons.push(...bulletOrderReasons(profile, draft.target.owner, after));
  } else {
    reasons.push(...termReasons(profile, job, after, draft.evidence));
  }
  const unique = [...new Set(reasons)];
  if (unique.length === 0) {
    return { outcome: "valid" };
  }
  return { outcome: "invalid", reasons: unique };
}

function fitReasons(profile: ProfileForModel, draft: FabricationDraft): string[] {
  return suggestionFitProblems(profile, draft);
}

function citationReasons(profile: ProfileForModel, draft: FabricationDraft): string[] {
  const target = draft.target;
  if (target.type === "bullet") {
    const cited = draft.evidence.some((evidence) => evidence.type === "bullet" && evidence.bulletId === target.bulletId);
    return cited ? [] : ["La sugerencia tiene que citar el bullet que reescribe."];
  }
  if (target.type === "summary") {
    return draft.evidence.some((evidence) => evidence.type === "summary")
      ? []
      : ["La sugerencia del resumen tiene que citar el resumen."];
  }
  if (target.type === "bullet_order") {
    return bulletOrderCitationReasons(profile, target.owner, draft.evidence);
  }
  const citedSkill = draft.evidence.some(
    (evidence) => evidence.type === "skill" && profile.skills.some((skill) => skill.id === evidence.skillId),
  );
  return citedSkill ? [] : ["La sugerencia de orden tiene que citar una habilidad del perfil."];
}

function bulletOrderCitationReasons(
  profile: ProfileForModel,
  owner: BulletOrderOwner,
  evidence: EvidenceRef[],
): string[] {
  const container = bulletOrderContainer(profile, owner);
  if (container === null) {
    return [];
  }
  const ids = new Set(container.bullets.map((bullet) => bullet.id));
  const cited = evidence.some((item) => item.type === "bullet" && ids.has(item.bulletId));
  if (cited) {
    return [];
  }
  return [
    container.kind === "experience"
      ? "La sugerencia de orden tiene que citar un bullet de ese empleo."
      : "La sugerencia de orden tiene que citar un bullet de ese proyecto.",
  ];
}

function bulletOrderReasons(profile: ProfileForModel, owner: BulletOrderOwner, after: string): string[] {
  const container = bulletOrderContainer(profile, owner);
  if (container === null) {
    return [];
  }
  const place = container.kind === "experience" ? "empleo" : "proyecto";
  return assessBulletOrder(container.bullets, after, place).reasons;
}

function skillOrderReasons(profile: ProfileForModel, after: string): string[] {
  if (profile.skills.length === 0) {
    return ["No hay habilidades para reordenar."];
  }
  const lines = after
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return ["El orden de habilidades necesita una habilidad por línea."];
  }
  const expected = new Map(profile.skills.map((skill) => [foldTerm(skill.name), skill.name]));
  const seen = new Set<string>();
  const reasons: string[] = [];
  for (const line of lines) {
    const key = foldTerm(line);
    const name = expected.get(key);
    if (name === undefined) {
      reasons.push(`El orden nombra «${line}», que no es una habilidad del perfil.`);
      continue;
    }
    if (seen.has(key)) {
      reasons.push(`La habilidad «${name}» está repetida en el orden.`);
    }
    seen.add(key);
  }
  for (const [key, name] of expected) {
    if (!seen.has(key)) {
      reasons.push(`Falta la habilidad «${name}» en el orden.`);
    }
  }
  return reasons;
}

function termReasons(profile: ProfileForModel, job: JobPosting, after: string, evidence: EvidenceRef[]): string[] {
  const category = categoryPhraseSupport(profile, after, evidence);
  const corpus = expandCorpus(profileCorpus(profile), job);
  const triggers = claimTriggers(job);
  const reasons: string[] = [...category.reasons];
  const seen = new Set<string>();
  for (const found of tokenize(after)) {
    if (category.tokens.has(foldTerm(found.token))) {
      continue;
    }
    if (!isClaim(found.token, after, found.index, triggers)) {
      continue;
    }
    if (isSupported(found.token, corpus)) {
      continue;
    }
    const key = foldTerm(found.token);
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    reasons.push(`El texto introduce «${found.token}», que no está en el perfil.`);
  }
  return reasons;
}

function categoryPhraseSupport(
  profile: ProfileForModel,
  after: string,
  evidence: readonly EvidenceRef[],
): { tokens: Set<string>; reasons: string[] } {
  const cited = citedBulletTexts(profile, evidence);
  const tokens = new Set<string>();
  const reasons: string[] = [];
  for (const row of CATEGORY_EQUIVALENCES) {
    const used = row.requirementPhrases.filter((phrase) => containsTerm(after, phrase));
    if (used.length === 0) {
      continue;
    }
    const supported = cited.some((text) => row.evidencePhrases.some((phrase) => containsTerm(text, phrase)));
    for (const phrase of used) {
      for (const token of foldTerm(phrase).split(" ")) {
        if (token.length > 0) {
          tokens.add(token);
        }
      }
      if (!supported) {
        reasons.push(`El texto introduce «${phrase}», que no está en el perfil.`);
      }
    }
  }
  return { tokens, reasons };
}

function citedBulletTexts(profile: ProfileForModel, evidence: readonly EvidenceRef[]): string[] {
  const ids = new Set(evidence.flatMap((item) => (item.type === "bullet" ? [item.bulletId] : [])));
  const texts: string[] = [];
  for (const experience of profile.experiences) {
    for (const bullet of experience.bullets) {
      if (ids.has(bullet.id)) {
        texts.push(bullet.text);
      }
    }
  }
  for (const project of profile.projects) {
    for (const bullet of project.bullets) {
      if (ids.has(bullet.id)) {
        texts.push(bullet.text);
      }
    }
  }
  return texts;
}

function profileCorpus(profile: ProfileForModel): string {
  const parts: string[] = [];
  const push = (value: string | null | undefined) => {
    if (value !== null && value !== undefined && value.length > 0) {
      parts.push(value);
    }
  };
  push(profile.summary);
  for (const experience of profile.experiences) {
    push(experience.organization);
    push(experience.role);
    push(experience.location);
    push(experience.span.start);
    push(experience.span.end);
    for (const bullet of experience.bullets) {
      push(bullet.text);
    }
  }
  for (const item of profile.education) {
    push(item.institution);
    push(item.title);
    push(item.span.start);
    push(item.span.end);
  }
  for (const skill of profile.skills) {
    push(skill.name);
  }
  for (const project of profile.projects) {
    push(project.name);
    push(project.description);
    for (const bullet of project.bullets) {
      push(bullet.text);
    }
  }
  return parts.join("\n");
}

function expandCorpus(base: string, job: JobPosting): string {
  const extras: string[] = [];
  const seen = new Set<string>();
  const supported = (form: string) =>
    containsTerm(base, form) || extras.some((extra) => foldTerm(extra) === foldTerm(form));
  const addForms = (forms: readonly string[]) => {
    if (!forms.some((form) => supported(form))) {
      return;
    }
    for (const form of forms) {
      const key = foldTerm(form);
      if (key.length === 0 || seen.has(key)) {
        continue;
      }
      seen.add(key);
      extras.push(form);
    }
  };
  for (const group of ALIAS_GROUPS) {
    addForms(group.forms);
  }
  for (const keyword of job.keywords) {
    addForms([keyword.canonical, ...keyword.aliases]);
  }
  return extras.length === 0 ? base : `${base}\n${extras.join("\n")}`;
}

function claimTriggers(job: JobPosting): Set<string> {
  const terms = new Set<string>();
  for (const keyword of job.keywords) {
    for (const form of [keyword.canonical, ...keyword.aliases]) {
      const folded = foldTerm(form);
      if (folded.length > 0) {
        terms.add(folded);
      }
    }
  }
  for (const source of [job.rawText, job.title ?? "", job.company ?? ""]) {
    for (const found of tokenize(source)) {
      if (!/^\p{Lu}/u.test(found.token)) {
        continue;
      }
      const folded = foldTerm(found.token);
      if (folded.length >= 3 && !COMMON.has(folded)) {
        terms.add(folded);
      }
    }
  }
  return terms;
}

function isClaim(token: string, text: string, index: number, triggers: ReadonlySet<string>): boolean {
  if (/\p{N}/u.test(token) || /[+#./]/.test(token) || isAcronym(token) || isCamelCase(token)) {
    return true;
  }
  if (dictionaryCanonical(token) !== null) {
    return true;
  }
  const folded = foldTerm(token);
  if (triggers.has(folded)) {
    return true;
  }
  return isMidSentenceTitle(token) && !isSentenceStart(text, index) && !COMMON.has(folded);
}

function isSupported(token: string, corpus: string): boolean {
  return supportForms(token).some((form) => containsTerm(corpus, form));
}

function supportForms(token: string): string[] {
  if (!isAcronym(token)) {
    return [token];
  }
  const bare = /s$/i.test(token) && token.length > 3 ? token.slice(0, -1) : token;
  return [token, bare, `${bare}s`];
}

function isAcronym(token: string): boolean {
  return /^\p{Lu}{2,}s?$/u.test(token);
}

function isCamelCase(token: string): boolean {
  return /\p{Ll}\p{Lu}|\p{Lu}\p{Ll}+\p{Lu}/u.test(token);
}

function isMidSentenceTitle(token: string): boolean {
  return /^\p{Lu}\p{Ll}{2,}$/u.test(token);
}

function isSentenceStart(text: string, index: number): boolean {
  const before = text.slice(0, index).trimEnd();
  if (before.length === 0) {
    return true;
  }
  const last = before.at(-1);
  return last === "." || last === "!" || last === "?" || last === "\n";
}

function tokenize(text: string): Array<{ token: string; index: number }> {
  const found: Array<{ token: string; index: number }> = [];
  for (const match of text.matchAll(TOKEN)) {
    if (match.index === undefined) {
      continue;
    }
    const token = cleanToken(match[0]);
    if (token.length === 0) {
      continue;
    }
    found.push({ token, index: match.index });
  }
  return found;
}

function cleanToken(raw: string): string {
  if (raw.endsWith(".") && !raw.slice(0, -1).includes(".")) {
    return raw.slice(0, -1);
  }
  return raw;
}
