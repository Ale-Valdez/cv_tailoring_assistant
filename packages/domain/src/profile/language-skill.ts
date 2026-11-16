import { z } from "zod";

import { requiredText } from "../text.ts";

export const languageLevelSchema = z.enum(["native", "A1", "A2", "B1", "B2", "C1", "C2"]);

export type LanguageLevel = z.infer<typeof languageLevelSchema>;

export const languageSkillSchema = z.strictObject({
  language: requiredText("El nombre del idioma es obligatorio."),
  level: languageLevelSchema,
});

export type LanguageSkill = z.infer<typeof languageSkillSchema>;
