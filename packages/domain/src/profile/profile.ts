import { z } from "zod";

import { repeatedValues } from "../collections.ts";
import { DomainError } from "../errors.ts";
import { profileIdSchema, type BulletId } from "../ids.ts";
import { parseSchema } from "../parse.ts";
import { blankToNull } from "../text.ts";
import { contactSchema } from "./contact.ts";
import { educationSchema } from "./education.ts";
import { experienceSchema } from "./experience.ts";
import { projectSchema } from "./project.ts";
import { skillEntrySchema } from "./skill.ts";

export const profileStatusSchema = z.enum(["needs_review", "confirmed"]);

export type ProfileStatus = z.infer<typeof profileStatusSchema>;

const profileObjectSchema = z.strictObject({
  id: profileIdSchema,
  status: profileStatusSchema,
  contact: contactSchema,
  summary: blankToNull,
  language: z.string().trim(),
  experiences: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillEntrySchema),
  projects: z.array(projectSchema),
});

type ProfileObject = z.infer<typeof profileObjectSchema>;

function structuralProblems(profile: ProfileObject): string[] {
  const problems: string[] = [];
  const bulletIds = [
    ...profile.experiences.flatMap((experience) => experience.bullets.map((bullet) => bullet.id)),
    ...profile.projects.flatMap((project) => project.bullets.map((bullet) => bullet.id)),
  ];
  if (repeatedValues(bulletIds).length > 0) {
    problems.push("Hay bullets con el mismo identificador.");
  }
  if (repeatedValues(profile.experiences.map((item) => item.id)).length > 0) {
    problems.push("Hay experiencias con el mismo identificador.");
  }
  if (repeatedValues(profile.education.map((item) => item.id)).length > 0) {
    problems.push("Hay formaciones con el mismo identificador.");
  }
  if (repeatedValues(profile.skills.map((item) => item.id)).length > 0) {
    problems.push("Hay habilidades con el mismo identificador.");
  }
  if (repeatedValues(profile.projects.map((item) => item.id)).length > 0) {
    problems.push("Hay proyectos con el mismo identificador.");
  }

  const skillNames = new Set<string>();
  for (const skill of profile.skills) {
    const key = skill.name.toLowerCase();
    if (skillNames.has(key)) {
      problems.push(`La habilidad «${skill.name}» está repetida.`);
    }
    skillNames.add(key);
  }
  return problems;
}

function readinessProblems(profile: ProfileObject): string[] {
  const problems: string[] = [];
  if (profile.contact.name.length === 0) {
    problems.push("El perfil confirmado necesita un nombre.");
  }
  if (profile.language.length === 0) {
    problems.push("El perfil confirmado necesita un idioma.");
  }
  if (profile.experiences.some((item) => item.organization.length === 0 || item.role.length === 0)) {
    problems.push("Cada experiencia necesita organización y rol.");
  }
  if (profile.education.some((item) => item.institution.length === 0 || item.title.length === 0)) {
    problems.push("Cada formación necesita institución y título.");
  }
  if (profile.projects.some((item) => item.name.length === 0)) {
    problems.push("Cada proyecto necesita un nombre.");
  }
  return problems;
}

function addProblems(
  ctx: z.RefinementCtx,
  problems: readonly string[],
): void {
  for (const message of problems) {
    ctx.addIssue({ code: "custom", message });
  }
}

export const profileSchema = profileObjectSchema.superRefine((profile, ctx) => {
  addProblems(ctx, structuralProblems(profile));
  if (profile.status === "confirmed") {
    addProblems(ctx, readinessProblems(profile));
  }
});

export type Profile = z.infer<typeof profileSchema>;

export type ConfirmedProfile = Profile & { readonly status: "confirmed" };

export type ProfileForModel = Omit<Profile, "contact">;

export function parseProfile(value: unknown): Profile {
  return parseSchema(profileSchema, value);
}

export function confirmProfile(profile: Profile): ConfirmedProfile {
  const problems = readinessProblems(profile);
  if (problems.length > 0) {
    throw new DomainError("profile_not_ready", problems.join("; "));
  }
  return {
    id: profile.id,
    status: "confirmed",
    contact: profile.contact,
    summary: profile.summary,
    language: profile.language,
    experiences: profile.experiences,
    education: profile.education,
    skills: profile.skills,
    projects: profile.projects,
  };
}

export function profileForModel(profile: Profile): ProfileForModel {
  return {
    id: profile.id,
    status: profile.status,
    summary: profile.summary,
    language: profile.language,
    experiences: profile.experiences,
    education: profile.education,
    skills: profile.skills,
    projects: profile.projects,
  };
}

export function listBulletIds(profile: ProfileForModel): ReadonlySet<BulletId> {
  const ids = new Set<BulletId>();
  for (const experience of profile.experiences) {
    for (const bullet of experience.bullets) {
      ids.add(bullet.id);
    }
  }
  for (const project of profile.projects) {
    for (const bullet of project.bullets) {
      ids.add(bullet.id);
    }
  }
  return ids;
}
