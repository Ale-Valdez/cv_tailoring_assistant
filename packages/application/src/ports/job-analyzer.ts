export interface ExtractedRequirement {
  text: string;
  kind: "technical" | "functional";
  priority: "required" | "preferred" | "unspecified";
  // Términos canónicos de `ExtractedKeyword.canonical` que este requisito
  // pide (Fase 3 del plan de auditoría, ADR-027). Opcional: un analizador
  // viejo o una llamada sin ese dato deja la lista vacía.
  keywordTerms?: readonly string[];
}

export interface ExtractedKeyword {
  canonical: string;
  aliases: string[];
  frequency: number;
  origin: string;
}

export interface ExtractedJobContent {
  title: string | null;
  company: string | null;
  language: string | null;
  requirements: ExtractedRequirement[];
  keywords: ExtractedKeyword[];
}

export interface JobAnalyzer {
  analyze(rawText: string): Promise<ExtractedJobContent>;
}
