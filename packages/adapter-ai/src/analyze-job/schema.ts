import { z } from "zod";

const optionalText = z.union([z.string(), z.null()]).transform((value) => {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
});

export const modelJobSchema = z.object({
  title: z.string().nullable().describe("Título del puesto, o null si no aparece."),
  company: z.string().nullable().describe("Empresa que publica, o null si no aparece."),
  language: z.string().nullable().describe("Idioma del texto, en una etiqueta corta como es o en, o null si no se puede saber."),
  requirements: z.array(
    z.object({
      text: z.string().describe("Requisito copiado de la oferta, sin inventar ni traducir."),
      kind: z.enum(["technical", "functional"]).describe("technical si pide una herramienta o conocimiento; functional si pide una responsabilidad."),
      priority: z
        .enum(["required", "preferred", "unspecified"])
        .describe(
          "required solo si la oferta lo marca como excluyente u obligatorio. preferred solo si lo marca como deseable, plus o no excluyente. unspecified en cualquier otro caso.",
        ),
      keywordTerms: z
        .array(z.string())
        .describe(
          "Términos canónicos, tal como los escribiste en keywords, que este requisito pide. Lista vacía si no nombra ninguna keyword. No inventes un término que no esté en keywords.",
        ),
    }),
  ),
  keywords: z.array(
    z.object({
      canonical: z.string().describe("Término ATS tal como aparece, o su nombre usual si hay un alias en el texto."),
      aliases: z.array(z.string()).describe("Otras formas del mismo término. No incluyas tecnologías parecidas."),
      frequency: z.int().nonnegative().describe("Cuántas veces aparece el término o sus alias."),
      origin: z.string().describe("Fragmento de donde sale: título, requisitos u otro."),
    }),
  ),
});

export const extractedJobSchema = z.object({
  title: optionalText,
  company: optionalText,
  language: optionalText,
  requirements: z.array(
    z.object({
      text: z.string().trim().min(1, "El requisito necesita un texto."),
      kind: z.enum(["technical", "functional"]),
      priority: z.enum(["required", "preferred", "unspecified"]),
      keywordTerms: z
        .array(z.string().trim().min(1, "Un término de keywordTerms no puede estar vacío."))
        .optional()
        .default([]),
    }),
  ),
  keywords: z.array(
    z.object({
      canonical: z.string().trim().min(1, "La keyword necesita un término canónico."),
      aliases: z.array(z.string().trim().min(1, "Un alias de keyword no puede estar vacío.")),
      frequency: z.int().nonnegative("La frecuencia no puede ser negativa."),
      origin: z.string().trim().min(1, "La keyword necesita un origen."),
    }),
  ),
});

export type ParsedExtractedJob = z.infer<typeof extractedJobSchema>;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function normalizeItems(value: unknown, mapItem: (item: Record<string, unknown>) => unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item) => {
    const record = asRecord(item);
    return record === undefined ? item : mapItem(record);
  });
}

export function normalizeJobDraft(value: unknown): unknown {
  const record = asRecord(value);
  if (record === undefined) {
    return value;
  }
  return {
    title: record.title,
    company: record.company,
    language: record.language,
    requirements: keptRecords(normalizeItems(record.requirements, (item) => item), "text"),
    keywords: keptRecords(normalizeItems(record.keywords, (item) => normalizeKeyword(item)), "canonical"),
  };
}

function normalizeKeyword(item: Record<string, unknown>): Record<string, unknown> {
  const aliases = Array.isArray(item.aliases)
    ? item.aliases.filter((alias) => typeof alias === "string" && alias.trim().length > 0)
    : item.aliases;
  const origin = typeof item.origin === "string" && item.origin.trim().length > 0 ? item.origin : "oferta";
  return { ...item, aliases, origin };
}

function keptRecords(value: unknown, field: string): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.filter((item) => {
    const record = asRecord(item);
    if (record === undefined) {
      return true;
    }
    const text = record[field];
    return typeof text !== "string" || text.trim().length > 0;
  });
}

export function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.map((part) => String(part)).join(".");
      const where = path.length > 0 ? path : "valor";
      return `${where}: ${issue.message}`;
    })
    .join("; ");
}
