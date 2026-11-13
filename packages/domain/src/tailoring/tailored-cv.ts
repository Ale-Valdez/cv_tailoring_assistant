import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import { jobPostingIdSchema, profileIdSchema, tailoredCvIdSchema } from "../ids.ts";
import { listBulletIds, profileSchema } from "../profile/profile.ts";
import { parseSchema } from "../parse.ts";
import { cvExportSchema } from "./cv-export.ts";
import { matchResultSchema } from "./match-result.ts";
import { suggestionFitProblems, suggestionSchema, type Suggestion } from "./suggestion.ts";

export const tailoredCvStatusSchema = z.enum(["draft", "in_review", "final"]);

export type TailoredCvStatus = z.infer<typeof tailoredCvStatusSchema>;

const tailoredCvObjectSchema = z.strictObject({
  id: tailoredCvIdSchema,
  profileId: profileIdSchema,
  jobPostingId: jobPostingIdSchema,
  status: tailoredCvStatusSchema,
  snapshot: profileSchema,
  suggestions: z.array(suggestionSchema),
  matchResults: z.array(matchResultSchema),
  exports: z.array(cvExportSchema),
});

export const tailoredCvSchema = tailoredCvObjectSchema.superRefine((cv, ctx) => {
  if (cv.snapshot.status !== "confirmed") {
    ctx.addIssue({
      code: "custom",
      message: "El CV adaptado parte de un perfil maestro confirmado.",
      path: ["snapshot", "status"],
    });
  }
  if (cv.snapshot.id !== cv.profileId) {
    ctx.addIssue({
      code: "custom",
      message: "El perfil del CV adaptado no coincide con la instantánea.",
      path: ["profileId"],
    });
  }
  if (repeatedValues(cv.suggestions.map((item) => item.id)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay sugerencias con el mismo identificador.",
      path: ["suggestions"],
    });
  }
  if (repeatedValues(cv.matchResults.map((item) => item.id)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay matches con el mismo identificador.",
      path: ["matchResults"],
    });
  }
  if (repeatedValues(cv.matchResults.map((item) => item.requirementId)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay más de un match para el mismo requisito.",
      path: ["matchResults"],
    });
  }
  if (repeatedValues(cv.exports.map((item) => item.id)).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay exportaciones con el mismo identificador.",
      path: ["exports"],
    });
  }
  const versions = cv.exports.map((item) => String(item.version));
  if (repeatedValues(versions).length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Hay exportaciones con la misma versión.",
      path: ["exports"],
    });
  }

  const bulletIds = listBulletIds(cv.snapshot);
  for (const suggestion of cv.suggestions) {
    for (const problem of suggestionFitProblems(cv.snapshot, suggestion)) {
      ctx.addIssue({ code: "custom", message: problem, path: ["suggestions"] });
    }
  }
  for (const match of cv.matchResults) {
    if (match.evidenceBulletIds.some((bulletId) => !bulletIds.has(bulletId))) {
      ctx.addIssue({
        code: "custom",
        message: "Un match cita un bullet que no está en el perfil.",
        path: ["matchResults"],
      });
      break;
    }
  }
});

export type TailoredCv = z.infer<typeof tailoredCvSchema>;

export function parseTailoredCv(value: unknown): TailoredCv {
  return parseSchema(tailoredCvSchema, value);
}

export function tailoredCvStatusFor(suggestions: readonly Suggestion[]): TailoredCvStatus {
  if (suggestions.length === 0) {
    return "draft";
  }
  if (suggestions.some((suggestion) => suggestion.status === "pending")) {
    return "in_review";
  }
  return "final";
}
