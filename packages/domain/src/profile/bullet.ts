import { z } from "zod";

import { bulletIdSchema } from "../ids.ts";
import { requiredText } from "../text.ts";

export const bulletSchema = z.strictObject({
  id: bulletIdSchema,
  text: requiredText("El texto del bullet no puede estar vacío."),
});

export type Bullet = z.infer<typeof bulletSchema>;
