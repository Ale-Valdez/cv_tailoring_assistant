import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import { keywordIdSchema } from "../ids.ts";
import { requiredText } from "../text.ts";

export const keywordSchema = z
  .strictObject({
    id: keywordIdSchema,
    canonical: requiredText("La keyword necesita un término canónico."),
    aliases: z.array(requiredText("Un alias de keyword no puede estar vacío.")),
    frequency: z.int().nonnegative("La frecuencia no puede ser negativa."),
    origin: requiredText("La keyword necesita un origen."),
  })
  .superRefine((keyword, ctx) => {
    const names = [keyword.canonical, ...keyword.aliases].map((value) => value.toLowerCase());
    if (repeatedValues(names).length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Los alias no se repiten ni coinciden con el término canónico.",
        path: ["aliases"],
      });
    }
  });

export type Keyword = z.infer<typeof keywordSchema>;
