import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import { bulletIdSchema, matchResultIdSchema, requirementIdSchema } from "../ids.ts";
import { parseSchema } from "../parse.ts";
import { blankToNull } from "../text.ts";

export const matchStatusSchema = z.enum(["covered", "partial", "gap"]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;

export const matchResultSchema = z
  .strictObject({
    id: matchResultIdSchema,
    requirementId: requirementIdSchema,
    status: matchStatusSchema,
    evidenceBulletIds: z.array(bulletIdSchema),
    note: blankToNull,
  })
  .superRefine((match, ctx) => {
    if (match.status !== "gap" && match.evidenceBulletIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Un requisito cubierto o parcial necesita al menos un bullet de evidencia.",
        path: ["evidenceBulletIds"],
      });
    }
    if (repeatedValues(match.evidenceBulletIds).length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Un match no puede repetir el mismo bullet de evidencia.",
        path: ["evidenceBulletIds"],
      });
    }
  });

export type MatchResult = z.infer<typeof matchResultSchema>;

export function parseMatchResult(value: unknown): MatchResult {
  return parseSchema(matchResultSchema, value);
}
