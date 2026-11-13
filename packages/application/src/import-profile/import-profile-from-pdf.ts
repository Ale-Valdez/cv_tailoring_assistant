import {
  createBulletId,
  createEducationId,
  createExperienceId,
  createProfileId,
  createProjectId,
  createSkillId,
  DomainError,
  parseProfile,
  type Profile,
} from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { PdfTextReader } from "../ports/pdf-text-reader.ts";
import type {
  ExtractedProfileContent,
  ExtractedSkill,
  ProfileExtractor,
} from "../ports/profile-extractor.ts";
import { redactContactFromCvText } from "./redact-cv-text.ts";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const PDF_WITHOUT_TEXT = "Este PDF no tiene texto seleccionable.";

export interface ImportProfileFromPdfDeps {
  pdfTextReader: PdfTextReader;
  profileExtractor: ProfileExtractor;
}

export async function importProfileFromPdf(
  deps: ImportProfileFromPdfDeps,
  pdf: Uint8Array,
): Promise<Profile> {
  if (pdf.byteLength === 0) {
    throw new ApplicationError("empty_pdf", "El archivo está vacío.");
  }
  if (pdf.byteLength > MAX_PDF_BYTES) {
    throw new ApplicationError("pdf_too_large", "El PDF supera el máximo de 10 MiB.");
  }

  const text = await deps.pdfTextReader.readText(pdf);
  if (text.trim().length === 0) {
    throw new ApplicationError("pdf_without_text", PDF_WITHOUT_TEXT);
  }

  const cvText = redactContactFromCvText(text);
  if (cvText.length === 0) {
    throw new ApplicationError("pdf_without_text", PDF_WITHOUT_TEXT);
  }

  const extracted = await deps.profileExtractor.extract(cvText);
  try {
    return profileFromExtraction(extracted);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_profile", error.message, error);
    }
    throw error;
  }
}

function profileFromExtraction(extracted: ExtractedProfileContent): Profile {
  return parseProfile({
    id: createProfileId(),
    status: "needs_review",
    contact: {
      name: "",
      email: null,
      phone: null,
      location: null,
      links: [],
    },
    summary: extracted.summary,
    language: extracted.language,
    experiences: extracted.experiences.map((experience) => ({
      id: createExperienceId(),
      organization: experience.organization,
      role: experience.role,
      span: experience.span,
      location: experience.location,
      bullets: textsToBullets(experience.bullets),
    })),
    education: extracted.education.map((education) => ({
      id: createEducationId(),
      institution: education.institution,
      title: education.title,
      span: education.span,
    })),
    skills: uniqueSkills(extracted.skills).map((skill) => ({
      id: createSkillId(),
      name: skill.name,
      source: "extracted_from_cv" as const,
    })),
    projects: extracted.projects.map((project) => ({
      id: createProjectId(),
      name: project.name,
      description: project.description,
      url: project.url,
      bullets: textsToBullets(project.bullets),
    })),
  });
}

function textsToBullets(texts: readonly string[]) {
  return texts
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .map((text) => ({ id: createBulletId(), text }));
}

function uniqueSkills(skills: readonly ExtractedSkill[]): ExtractedSkill[] {
  const seen = new Set<string>();
  const unique: ExtractedSkill[] = [];
  for (const skill of skills) {
    const name = skill.name.trim();
    if (name.length === 0) {
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push({ name });
  }
  return unique;
}
