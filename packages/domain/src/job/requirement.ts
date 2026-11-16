import { z } from "zod";

import { keywordIdSchema, requirementIdSchema } from "../ids.ts";
import { requiredText } from "../text.ts";

export const requirementKindSchema = z.enum(["technical", "functional"]);
export type RequirementKind = z.infer<typeof requirementKindSchema>;

// "unspecified" es una responsabilidad o mención suelta que la oferta no marca
// como excluyente ni como deseable (Fase 3 del plan de auditoría, ADR-027).
export const requirementPrioritySchema = z.enum(["required", "preferred", "unspecified"]);
export type RequirementPriority = z.infer<typeof requirementPrioritySchema>;

export const requirementSchema = z.strictObject({
  id: requirementIdSchema,
  text: requiredText("El requisito necesita un texto."),
  kind: requirementKindSchema,
  priority: requirementPrioritySchema,
  // Keywords de `JobPosting.keywords` que este requisito pide, explícitas
  // (ADR-027). Un documento guardado antes de la Fase 3 se normaliza a `[]`
  // al leer (ver `job-posting.ts`).
  keywordIds: z.array(keywordIdSchema),
});

export type Requirement = z.infer<typeof requirementSchema>;
