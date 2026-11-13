import type {
  Bullet,
  ContactLink,
  DateSpan,
  Education,
  Experience,
  Project,
  SkillEntry,
} from "@cv-tailor/contracts";

function uuid(): string {
  return crypto.randomUUID();
}

function emptySpan(): DateSpan {
  return { start: null, end: null, ongoing: false };
}

export function emptyExperience(): Experience {
  return {
    id: uuid() as Experience["id"],
    organization: "",
    role: "",
    span: emptySpan(),
    location: null,
    bullets: [],
  };
}

export function emptyEducation(): Education {
  return {
    id: uuid() as Education["id"],
    institution: "",
    title: "",
    span: emptySpan(),
  };
}

export function emptyBullet(): Bullet {
  return {
    id: uuid() as Bullet["id"],
    text: "",
  };
}

export function declaredSkill(name: string): SkillEntry {
  return {
    id: uuid() as SkillEntry["id"],
    name,
    source: "declared_by_user",
  };
}

export function emptyProject(): Project {
  return {
    id: uuid() as Project["id"],
    name: "",
    description: null,
    url: null,
    bullets: [],
  };
}

export function emptyLink(): ContactLink {
  return { label: "", url: "" };
}
