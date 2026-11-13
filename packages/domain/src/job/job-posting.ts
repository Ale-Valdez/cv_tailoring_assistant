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

export const jobPostingSchema = jobPostingObjectSchema.superRefine((posting, ctx) => {
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
});

export type JobPosting = z.infer<typeof jobPostingSchema>;

export function parseJobPosting(value: unknown): JobPosting {
  return parseSchema(jobPostingSchema, value);
}
