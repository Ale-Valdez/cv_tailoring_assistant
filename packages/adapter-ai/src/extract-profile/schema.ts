import { z } from "zod";

import { dateSpanSchema } from "@cv-tailor/domain";

const optionalText = z.union([z.string(), z.null()]).transform((value) => {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
});

const optionalUrl = optionalText.pipe(z.url("La URL no es válida.").nullable());

const modelDateSpan = z.object({
  start: z.string().nullable().describe("Mes de inicio en formato AAAA-MM, o null."),
  end: z.string().nullable().describe("Mes de fin en formato AAAA-MM, o null si el período sigue abierto."),
  ongoing: z.boolean().describe("True solo si el texto dice que el período sigue abierto."),
});

export const modelProfileSchema = z.object({
  summary: z.string().nullable().describe("Resumen copiado del texto, o null si no hay."),
  language: z.string().describe("Idioma del texto, en una etiqueta corta como es o en."),
  experiences: z.array(
    z.object({
      organization: z.string(),
      role: z.string(),
      span: modelDateSpan,
      location: z.string().nullable(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      title: z.string(),
      span: modelDateSpan,
    }),
  ),
  skills: z.array(z.object({ name: z.string() })),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullable(),
      url: z.string().nullable(),
      bullets: z.array(z.string()),
    }),
  ),
});

export const extractedProfileSchema = z.object({
  summary: optionalText,
  language: z.string().trim().min(1, "Falta el idioma del CV."),
  experiences: z.array(
    z.object({
      organization: z.string().trim(),
      role: z.string().trim(),
      span: dateSpanSchema,
      location: optionalText,
      bullets: z.array(z.string().trim()),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string().trim(),
      title: z.string().trim(),
      span: dateSpanSchema,
    }),
  ),
  skills: z.array(z.object({ name: z.string().trim() })),
  projects: z.array(
    z.object({
      name: z.string().trim(),
      description: optionalText,
      url: optionalUrl,
      bullets: z.array(z.string().trim()),
    }),
  ),
});

export type ParsedExtractedProfile = z.infer<typeof extractedProfileSchema>;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeSpan(value: unknown): unknown {
  const record = asRecord(value);
  if (record === undefined) {
    return value;
  }
  return {
    start: textOrNull(record.start),
    end: textOrNull(record.end),
    ongoing: record.ongoing === true,
  };
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

export function normalizeExtractedDraft(value: unknown): unknown {
  const record = asRecord(value);
  if (record === undefined) {
    return value;
  }
  return {
    summary: textOrNull(record.summary),
    language: typeof record.language === "string" ? record.language : record.language,
    experiences: normalizeItems(record.experiences, (item) => ({
      ...item,
      location: textOrNull(item.location),
      span: normalizeSpan(item.span),
    })),
    education: normalizeItems(record.education, (item) => ({
      ...item,
      span: normalizeSpan(item.span),
    })),
    skills: record.skills,
    projects: normalizeItems(record.projects, (item) => ({
      ...item,
      description: textOrNull(item.description),
      url: textOrNull(item.url),
    })),
  };
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
