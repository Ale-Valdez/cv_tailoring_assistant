import { evidenceRefSchema, suggestionTargetSchema } from "@cv-tailor/domain";
import { z } from "zod";

const evidenceTypeSchema = z.enum(["bullet", "skill", "summary", "experience", "education", "project"]);

export const modelProposalSchema = z.object({
  suggestions: z
    .array(
      z.object({
        targetType: z
          .enum(["summary", "bullet", "skill_order", "bullet_order"])
          .describe(
            "summary para el resumen, bullet para un bullet, skill_order para reordenar habilidades, bullet_order para reordenar los bullets de un empleo o de un proyecto.",
          ),
        bulletId: z
          .string()
          .nullable()
          .describe("Id exacto del bullet cuando targetType es bullet. Null en los otros casos."),
        ownerType: z
          .enum(["experience", "project"])
          .nullable()
          .describe(
            "experience o project cuando targetType es bullet_order. Null en los otros casos.",
          ),
        ownerId: z
          .string()
          .nullable()
          .describe(
            "Id exacto del empleo o del proyecto cuando targetType es bullet_order. Null en los otros casos.",
          ),
        after: z
          .string()
          .describe(
            "Texto resultante, en el idioma del perfil, sin datos nuevos. En bullet_order, la lista completa del bloque, un texto por línea.",
          ),
        reason: z.string().describe("Por qué el cambio acerca el CV a la oferta sin inventar."),
        evidence: z
          .array(
            z.object({
              type: evidenceTypeSchema.describe("Qué parte del perfil respalda el texto."),
              id: z
                .string()
                .nullable()
                .describe("Id exacto de esa parte. Null solo cuando type es summary."),
            }),
          )
          .describe("Ids del perfil que respaldan el texto."),
      }),
    )
    .describe("Lista vacía si no hay un cambio respaldado por el perfil."),
});

export const proposalSchema = z.object({
  suggestions: z.array(
    z.object({
      target: suggestionTargetSchema,
      after: z.string().trim().min(1, "La sugerencia necesita un texto resultante."),
      reason: z.string().trim().min(1, "La sugerencia necesita un motivo."),
      evidence: z.array(evidenceRefSchema).min(1, "La sugerencia tiene que citar evidencia del perfil."),
    }),
  ),
});

export type ParsedProposal = z.infer<typeof proposalSchema>;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function normalizeProposalDraft(value: unknown): unknown {
  const record = asRecord(value);
  if (record === undefined) {
    return value;
  }
  if (!Array.isArray(record.suggestions)) {
    return { suggestions: record.suggestions };
  }
  return {
    suggestions: record.suggestions.flatMap((item) => {
      const suggestion = asRecord(item);
      if (suggestion === undefined) {
        return [item];
      }
      const after = typeof suggestion.after === "string" ? suggestion.after.trim() : suggestion.after;
      const reason = typeof suggestion.reason === "string" ? suggestion.reason.trim() : suggestion.reason;
      if (after === "" || reason === "") {
        return [];
      }
      return [
        {
          target: normalizeTarget(suggestion),
          after,
          reason,
          evidence: normalizeEvidence(suggestion.evidence),
        },
      ];
    }),
  };
}

function normalizeTarget(suggestion: Record<string, unknown>): unknown {
  const target = asRecord(suggestion.target);
  if (target !== undefined) {
    return target;
  }
  if (suggestion.targetType === "bullet") {
    return { type: "bullet", bulletId: suggestion.bulletId };
  }
  if (suggestion.targetType === "summary" || suggestion.targetType === "skill_order") {
    return { type: suggestion.targetType };
  }
  if (suggestion.targetType === "bullet_order" && suggestion.ownerType === "experience") {
    return { type: "bullet_order", owner: { type: "experience", experienceId: suggestion.ownerId } };
  }
  if (suggestion.targetType === "bullet_order" && suggestion.ownerType === "project") {
    return { type: "bullet_order", owner: { type: "project", projectId: suggestion.ownerId } };
  }
  return suggestion.target;
}

function normalizeEvidence(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item) => {
    const evidence = asRecord(item);
    if (evidence === undefined || evidence.id === undefined) {
      return item;
    }
    if (evidence.type === "summary") {
      return { type: "summary" };
    }
    const idKey = evidenceIdKey(evidence.type);
    if (idKey === null) {
      return item;
    }
    return { type: evidence.type, [idKey]: evidence.id };
  });
}

function evidenceIdKey(type: unknown): string | null {
  if (type === "bullet") {
    return "bulletId";
  }
  if (type === "skill") {
    return "skillId";
  }
  if (type === "experience") {
    return "experienceId";
  }
  if (type === "education") {
    return "educationId";
  }
  if (type === "project") {
    return "projectId";
  }
  return null;
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
