import type { TailoredCv } from "@cv-tailor/contracts";

export function bulletOrderBlockLabel(
  cv: TailoredCv,
  owner: { type: "experience"; experienceId: string } | { type: "project"; projectId: string },
): string {
  if (owner.type === "experience") {
    const experience = cv.snapshot.experiences.find((item) => item.id === owner.experienceId);
    return experience === undefined ? "Empleo" : `${experience.role} en ${experience.organization}`;
  }
  const project = cv.snapshot.projects.find((item) => item.id === owner.projectId);
  return project === undefined ? "Proyecto" : `proyecto ${project.name}`;
}
