import { z } from "zod";

import {
  bulletIdSchema,
  educationIdSchema,
  experienceIdSchema,
  projectIdSchema,
  skillIdSchema,
  suggestionIdSchema,
} from "../ids.ts";
import { DomainError } from "../errors.ts";
import { parseSchema } from "../parse.ts";
import { listBulletIds, type ProfileForModel } from "../profile/profile.ts";
import { requiredText } from "../text.ts";

export const suggestionStatusSchema = z.enum(["pending", "accepted", "edited", "rejected"]);

export type SuggestionStatus = z.infer<typeof suggestionStatusSchema>;

export const evidenceRefSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("bullet"), bulletId: bulletIdSchema }),
  z.strictObject({ type: z.literal("skill"), skillId: skillIdSchema }),
  z.strictObject({ type: z.literal("summary") }),
  z.strictObject({ type: z.literal("experience"), experienceId: experienceIdSchema }),
  z.strictObject({ type: z.literal("education"), educationId: educationIdSchema }),
  z.strictObject({ type: z.literal("project"), projectId: projectIdSchema }),
]);

export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

export const suggestionTargetSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("summary") }),
  z.strictObject({ type: z.literal("bullet"), bulletId: bulletIdSchema }),
  z.strictObject({ type: z.literal("skill_order") }),
]);

export type SuggestionTarget = z.infer<typeof suggestionTargetSchema>;

export const suggestionValidationSchema = z.discriminatedUnion("outcome", [
  z.strictObject({ outcome: z.literal("not_checked") }),
  z.strictObject({ outcome: z.literal("valid") }),
  z.strictObject({
    outcome: z.literal("invalid"),
    reasons: z.array(requiredText("El motivo de invalidez no puede estar vacío.")).min(1),
  }),
]);

export type SuggestionValidation = z.infer<typeof suggestionValidationSchema>;

export const suggestionSchema = z.strictObject({
  id: suggestionIdSchema,
  target: suggestionTargetSchema,
  before: z.string().trim(),
  after: requiredText("La sugerencia necesita un texto resultante."),
  reason: requiredText("La sugerencia necesita un motivo."),
  evidence: z.array(evidenceRefSchema).min(1, "La sugerencia tiene que citar evidencia del perfil."),
  status: suggestionStatusSchema,
  validation: suggestionValidationSchema,
});

export type Suggestion = z.infer<typeof suggestionSchema>;

export type ReviewDecision =
  | { type: "accept" }
  | { type: "edit"; text: string }
  | { type: "reject" };

export function parseSuggestion(value: unknown): Suggestion {
  return parseSchema(suggestionSchema, value);
}

export function reviewSuggestion(suggestion: Suggestion, decision: ReviewDecision): Suggestion {
  if (suggestion.status !== "pending") {
    throw new DomainError("invalid_transition", "Solo se puede revisar una sugerencia pendiente.");
  }
  if (decision.type === "accept") {
    if (suggestion.validation.outcome !== "valid") {
      throw new DomainError(
        "invalid_transition",
        "Solo se puede aceptar una sugerencia que pasó el fabrication guard.",
      );
    }
    return { ...suggestion, status: "accepted" };
  }
  if (decision.type === "reject") {
    return { ...suggestion, status: "rejected" };
  }
  const text = decision.text.trim();
  if (text.length === 0) {
    throw new DomainError("invalid_input", "El texto editado no puede estar vacío.");
  }
  return {
    ...suggestion,
    status: "edited",
    after: text,
    validation: { outcome: "not_checked" },
  };
}

export function evidenceFitsProfile(profile: ProfileForModel, evidence: EvidenceRef): boolean {
  switch (evidence.type) {
    case "summary":
      return true;
    case "bullet":
      return listBulletIds(profile).has(evidence.bulletId);
    case "skill":
      return profile.skills.some((skill) => skill.id === evidence.skillId);
    case "experience":
      return profile.experiences.some((item) => item.id === evidence.experienceId);
    case "education":
      return profile.education.some((item) => item.id === evidence.educationId);
    case "project":
      return profile.projects.some((item) => item.id === evidence.projectId);
    default: {
      const unreachable: never = evidence;
      return unreachable;
    }
  }
}

export function suggestionFitProblems(
  profile: ProfileForModel,
  suggestion: Pick<Suggestion, "target" | "evidence">,
): string[] {
  const problems: string[] = [];
  if (suggestion.target.type === "bullet" && !listBulletIds(profile).has(suggestion.target.bulletId)) {
    problems.push("La sugerencia apunta a un bullet que no está en el perfil.");
  }
  if (suggestion.evidence.some((evidence) => !evidenceFitsProfile(profile, evidence))) {
    problems.push("La sugerencia cita evidencia que no está en el perfil.");
  }
  return problems;
}
