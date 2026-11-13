import { foldTerm } from "../job/normalize-keywords.ts";
import { DomainError } from "../errors.ts";
import { confirmProfile, parseProfile, type ConfirmedProfile } from "../profile/profile.ts";
import type { SkillEntry } from "../profile/skill.ts";
import type { Suggestion } from "./suggestion.ts";
import type { TailoredCv } from "./tailored-cv.ts";

export function profileForRender(cv: TailoredCv): ConfirmedProfile {
  let profile: ConfirmedProfile = confirmProfile(cv.snapshot);
  for (const suggestion of cv.suggestions) {
    if (!isApplied(suggestion)) {
      continue;
    }
    profile = applySuggestion(profile, suggestion);
  }
  return confirmProfile(parseProfile(profile));
}

function isApplied(suggestion: Suggestion): boolean {
  const reviewed = suggestion.status === "accepted" || suggestion.status === "edited";
  return reviewed && suggestion.validation.outcome === "valid";
}

function applySuggestion(profile: ConfirmedProfile, suggestion: Suggestion): ConfirmedProfile {
  const target = suggestion.target;
  if (target.type === "summary") {
    return { ...profile, summary: suggestion.after };
  }
  if (target.type === "skill_order") {
    return { ...profile, skills: orderedSkills(profile.skills, suggestion.after) };
  }
  return replaceBullet(profile, target.bulletId, suggestion.after);
}

function replaceBullet(profile: ConfirmedProfile, bulletId: string, text: string): ConfirmedProfile {
  let found = false;
  const experiences = profile.experiences.map((experience) => ({
    ...experience,
    bullets: experience.bullets.map((bullet) => {
      if (bullet.id !== bulletId) {
        return bullet;
      }
      found = true;
      return { ...bullet, text };
    }),
  }));
  const projects = profile.projects.map((project) => ({
    ...project,
    bullets: project.bullets.map((bullet) => {
      if (bullet.id !== bulletId) {
        return bullet;
      }
      found = true;
      return { ...bullet, text };
    }),
  }));
  if (!found) {
    throw new DomainError("invalid_input", "La sugerencia apunta a un bullet que no está en el perfil.");
  }
  return { ...profile, experiences, projects };
}

function orderedSkills(skills: readonly SkillEntry[], after: string): SkillEntry[] {
  const lines = after
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const byName = new Map(skills.map((skill) => [foldTerm(skill.name), skill]));
  const seen = new Set<string>();
  const ordered: SkillEntry[] = [];
  for (const line of lines) {
    const key = foldTerm(line);
    const skill = byName.get(key);
    if (skill === undefined || seen.has(key)) {
      throw new DomainError("invalid_input", "El orden de habilidades no coincide con el perfil.");
    }
    seen.add(key);
    ordered.push(skill);
  }
  if (ordered.length !== skills.length) {
    throw new DomainError("invalid_input", "El orden de habilidades no coincide con el perfil.");
  }
  return ordered;
}
