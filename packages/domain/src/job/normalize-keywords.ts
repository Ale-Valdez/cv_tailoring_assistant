import { ALIAS_GROUPS } from "./keyword-aliases.ts";

export interface KeywordDraft {
  canonical: string;
  aliases: readonly string[];
  frequency: number;
  origin: string;
}

export function foldTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim()
    .replace(/ +/g, " ");
}

export function containsTerm(haystack: string, term: string): boolean {
  const needle = foldTerm(term);
  if (needle.length === 0) {
    return false;
  }
  return ` ${foldTerm(haystack)} `.includes(` ${needle} `);
}

export function dictionaryCanonical(value: string): string | null {
  const folded = foldTerm(value);
  if (folded.length === 0) {
    return null;
  }
  const group = ALIAS_GROUPS.find((item) => item.forms.some((form) => foldTerm(form) === folded));
  return group?.canonical ?? null;
}

export function canonicalTerm(value: string): { canonical: string; aliases: string[] } {
  const folded = foldTerm(value);
  if (folded.length === 0) {
    return { canonical: "", aliases: [] };
  }
  const group = ALIAS_GROUPS.find((item) => item.forms.some((form) => foldTerm(form) === folded));
  if (group === undefined) {
    return { canonical: collapseWhitespace(value), aliases: [] };
  }
  return {
    canonical: group.canonical,
    aliases: uniqueDisplays(group.forms.filter((form) => foldTerm(form) !== foldTerm(group.canonical))),
  };
}

export function normalizeKeywordDrafts(drafts: readonly KeywordDraft[]): KeywordDraft[] {
  const groups = new Map<string, Accumulator>();
  for (const draft of drafts) {
    const resolved = canonicalTerm(draft.canonical);
    const key = foldTerm(resolved.canonical);
    if (key.length === 0) {
      continue;
    }
    const current = groups.get(key) ?? {
      canonical: resolved.canonical,
      aliases: new Map<string, string>(),
      frequency: 0,
      origins: [],
    };
    if (dictionaryCanonical(resolved.canonical) !== null) {
      current.canonical = resolved.canonical;
    }
    rememberAlias(current, resolved.canonical);
    for (const alias of [...resolved.aliases, ...draft.aliases]) {
      rememberAlias(current, alias);
    }
    current.frequency += draft.frequency;
    const origin = collapseWhitespace(draft.origin);
    if (origin.length > 0 && !current.origins.includes(origin)) {
      current.origins.push(origin);
    }
    groups.set(key, current);
  }

  return [...groups.values()].map((group) => ({
    canonical: group.canonical,
    aliases: [...group.aliases.entries()]
      .filter(([folded]) => folded !== foldTerm(group.canonical) && aliasFits(group.canonical, folded))
      .map(([, display]) => display),
    frequency: group.frequency,
    origin: group.origins.length > 0 ? group.origins.join(", ") : "oferta",
  }));
}

interface Accumulator {
  canonical: string;
  aliases: Map<string, string>;
  frequency: number;
  origins: string[];
}

function rememberAlias(group: Accumulator, value: string): void {
  const display = collapseWhitespace(value);
  const folded = foldTerm(display);
  if (folded.length === 0 || group.aliases.has(folded)) {
    return;
  }
  group.aliases.set(folded, display);
}

function aliasFits(canonical: string, aliasFolded: string): boolean {
  const aliasGroup = dictionaryCanonical(aliasFolded);
  if (aliasGroup === null) {
    return true;
  }
  const canonicalGroup = dictionaryCanonical(canonical);
  return canonicalGroup !== null && foldTerm(aliasGroup) === foldTerm(canonicalGroup);
}

function uniqueDisplays(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const display = collapseWhitespace(value);
    const folded = foldTerm(display);
    if (folded.length === 0 || seen.has(folded)) {
      continue;
    }
    seen.add(folded);
    unique.push(display);
  }
  return unique;
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
