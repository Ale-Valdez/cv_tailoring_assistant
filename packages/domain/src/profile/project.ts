import { z } from "zod";

import { projectIdSchema } from "../ids.ts";
import { blankToNull, optionalUrl } from "../text.ts";
import { bulletSchema } from "./bullet.ts";

export const projectSchema = z.strictObject({
  id: projectIdSchema,
  name: z.string().trim(),
  description: blankToNull,
  url: optionalUrl,
  bullets: z.array(bulletSchema),
});

export type Project = z.infer<typeof projectSchema>;
