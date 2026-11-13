import { z } from "zod";

import { requirementIdSchema } from "../ids.ts";
import { requiredText } from "../text.ts";

export const requirementKindSchema = z.enum(["technical", "functional"]);
export type RequirementKind = z.infer<typeof requirementKindSchema>;

export const requirementPrioritySchema = z.enum(["required", "preferred"]);
export type RequirementPriority = z.infer<typeof requirementPrioritySchema>;

export const requirementSchema = z.strictObject({
  id: requirementIdSchema,
  text: requiredText("El requisito necesita un texto."),
  kind: requirementKindSchema,
  priority: requirementPrioritySchema,
});

export type Requirement = z.infer<typeof requirementSchema>;
