import { z } from "zod";

import { dateSpanSchema } from "../date-span.ts";
import { experienceIdSchema } from "../ids.ts";
import { blankToNull } from "../text.ts";
import { bulletSchema } from "./bullet.ts";

export const experienceSchema = z.strictObject({
  id: experienceIdSchema,
  organization: z.string().trim(),
  role: z.string().trim(),
  span: dateSpanSchema,
  location: blankToNull,
  bullets: z.array(bulletSchema),
});

export type Experience = z.infer<typeof experienceSchema>;
