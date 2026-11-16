import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import { jobPostingIdSchema } from "../ids.ts";
import { parseSchema } from "../parse.ts";
import { blankToNull, requiredText } from "../text.ts";
import { keywordSchema } from "./keyword.ts";
import { requirementSchema } from "./requirement.ts";

const jobPostingObjectSchema = z.strictObject({
  id: jobPostingIdSchema,
  rawText: requiredText("La oferta no tiene texto."),
  title: blankToNull,
  company: blankToNull,
  language: blankToNull,
  contentHash: requiredText("La oferta necesita un hash de contenido."),
  requirements: z.array(requirementSchema),
  keywords: z.array(keywordSchema),
});

const jobPostingCheckedSchema = jobPostingObjectSchema.superRefine((posting, ctx) => {
  if (repeatedValues(posting.requirements.map((item) => item.id)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay requisitos con el mismo identificador.",
      path: ["requirements"],
    });
  }
  if (repeatedValues(posting.keywords.map((item) => item.id)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay keywords con el mismo identificador.",
      path: ["keywords"],
    });
  }
  const canonicals = posting.keywords.map((item) => item.canonical.toLowerCase());
  if (repeatedValues(canonicals).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay keywords con el mismo término canónico.",
      path: ["keywords"],
    });
  }
  const keywordIds = new Set(posting.keywords.map((item) => item.id));
  posting.requirements.forEach((requirement, index) => {
    if (repeatedValues(requirement.keywordIds).length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Un requisito no puede repetir la misma keyword.",
        path: ["requirements", index, "keywordIds"],
      });
    }
    if (requirement.keywordIds.some((keywordId) => !keywordIds.has(keywordId))) {
      ctx.addIssue({
        code: "custom",
        message: "Un requisito solo puede citar keywords que están en la oferta.",
        path: ["requirements", index, "keywordIds"],
      });
    }
  });
});

// Un documento guardado antes de la Fase 3 (ADR-027) no tiene `keywordIds` en
// sus requisitos. Se normaliza a `[]` al leer, sin migración SQL.
export const jobPostingSchema = z.preprocess(normalizeJobPostingDocument, jobPostingCheckedSchema);

export type JobPosting = z.infer<typeof jobPostingSchema>;

function normalizeJobPostingDocument(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const record = { ...(value as Record<string, unknown>) };
  if (Array.isArray(record.requirements)) {
    record.requirements = record.requirements.map((requirement) => {
      if (typeof requirement !== "object" || requirement === null || Array.isArray(requirement)) {
        return requirement;
      }
      const requirementRecord = { ...(requirement as Record<string, unknown>) };
      if (requirementRecord.keywordIds === undefined) {
        requirementRecord.keywordIds = [];
      }
      return requirementRecord;
    });
  }
  return record;
}

export function parseJobPosting(value: unknown): JobPosting {
  return parseSchema(jobPostingSchema, value);
}
