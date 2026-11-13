import { z } from "zod";

import { dateSpanSchema } from "../date-span.ts";
import { educationIdSchema } from "../ids.ts";

export const educationSchema = z.strictObject({
  id: educationIdSchema,
  institution: z.string().trim(),
  title: z.string().trim(),
  span: dateSpanSchema,
});

export type Education = z.infer<typeof educationSchema>;
