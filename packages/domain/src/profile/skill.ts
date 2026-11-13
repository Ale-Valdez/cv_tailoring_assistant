import { z } from "zod";

import { skillIdSchema } from "../ids.ts";
import { requiredText } from "../text.ts";

export const skillSourceSchema = z.enum(["extracted_from_cv", "declared_by_user"]);

export type SkillSource = z.infer<typeof skillSourceSchema>;

export const skillEntrySchema = z.strictObject({
  id: skillIdSchema,
  name: requiredText("La habilidad necesita un nombre."),
  source: skillSourceSchema,
});

export type SkillEntry = z.infer<typeof skillEntrySchema>;
