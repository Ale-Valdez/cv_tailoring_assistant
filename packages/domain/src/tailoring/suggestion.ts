import { z } from "zod";

import { DomainError } from "../errors.ts";
import {
  bulletIdSchema,
  educationIdSchema,
  experienceIdSchema,
  projectIdSchema,
  skillIdSchema,
  suggestionIdSchema,
  type BulletId,
} from "../ids.ts";
import { foldTerm } from "../job/normalize-keywords.ts";
import { parseSchema } from "../parse.ts";
import type { Bullet } from "../profile/bullet.ts";
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

export const bulletOrderOwnerSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("experience"), experienceId: experienceIdSchema }),
  z.strictObject({ type: z.literal("project"), projectId: projectIdSchema }),
]);

export type BulletOrderOwner = z.infer<typeof bulletOrderOwnerSchema>;

export const suggestionTargetSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("summary") }),
  z.strictObject({ type: z.literal("bullet"), bulletId: bulletIdSchema }),
  z.strictObject({ type: z.literal("skill_order") }),
  z.strictObject({ type: z.literal("bullet_order"), owner: bulletOrderOwnerSchema }),
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
  if (suggestion.target.type === "bullet_order" && bulletOrderContainer(profile, suggestion.target.owner) === null) {
    problems.push(
      suggestion.target.owner.type === "experience"
        ? "La sugerencia apunta a un empleo que no está en el perfil."
        : "La sugerencia apunta a un proyecto que no está en el perfil.",
    );
  }
  if (suggestion.evidence.some((evidence) => !evidenceFitsProfile(profile, evidence))) {
    problems.push("La sugerencia cita evidencia que no está en el perfil.");
  }
  return problems;
}

type BulletListProfile = {
  experiences: readonly { id: string; bullets: readonly Bullet[] }[];
  projects: readonly { id: string; bullets: readonly Bullet[] }[];
};

export function bulletOrderContainer(
  profile: BulletListProfile,
  owner: BulletOrderOwner,
): { kind: "experience" | "project"; bullets: readonly Bullet[] } | null {
  if (owner.type === "experience") {
    const experience = profile.experiences.find((item) => item.id === owner.experienceId);
    return experience === undefined ? null : { kind: "experience", bullets: experience.bullets };
  }
  const project = profile.projects.find((item) => item.id === owner.projectId);
  return project === undefined ? null : { kind: "project", bullets: project.bullets };
}

export function assessBulletOrder(
  bullets: readonly { id: BulletId; text: string }[],
  after: string,
  place: "empleo" | "proyecto",
): { ids: BulletId[]; reasons: string[] } {
  if (bullets.length < 2) {
    return { ids: [], reasons: ["No hay bullets para reordenar."] };
  }
  if (bullets.some((bullet) => bullet.text.includes("\n"))) {
    return { ids: [], reasons: [`Un bullet de ese ${place} ocupa más de una línea.`] };
  }
  const folded = bullets.map((bullet) => foldTerm(bullet.text));
  if (new Set(folded).size !== folded.length) {
    return {
      ids: [],
      reasons: [`Dos bullets de ese ${place} dicen lo mismo y no se pueden reordenar.`],
    };
  }
  const lines = after
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { ids: [], reasons: ["El orden de bullets necesita un bullet por línea."] };
  }
  const expected = new Map(bullets.map((bullet) => [foldTerm(bullet.text), bullet]));
  const seen = new Set<string>();
  const reasons: string[] = [];
  const ids: BulletId[] = [];
  for (const line of lines) {
    const key = foldTerm(line);
    const bullet = expected.get(key);
    if (bullet === undefined) {
      reasons.push(`El orden nombra «${line}», que no es un bullet de ese ${place}.`);
      continue;
    }
    if (seen.has(key)) {
      reasons.push(`El bullet «${bullet.text}» está repetido en el orden.`);
      continue;
    }
    seen.add(key);
    ids.push(bullet.id);
  }
  for (const [key, bullet] of expected) {
    if (!seen.has(key)) {
      reasons.push(`Falta el bullet «${bullet.text}» en el orden.`);
    }
  }
  return { ids, reasons };
}
