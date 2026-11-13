export interface ExtractedDateSpan {
  start: string | null;
  end: string | null;
  ongoing: boolean;
}

export interface ExtractedExperience {
  organization: string;
  role: string;
  span: ExtractedDateSpan;
  location: string | null;
  bullets: string[];
}

export interface ExtractedEducation {
  institution: string;
  title: string;
  span: ExtractedDateSpan;
}

export interface ExtractedSkill {
  name: string;
}

export interface ExtractedProject {
  name: string;
  description: string | null;
  url: string | null;
  bullets: string[];
}

export interface ExtractedProfileContent {
  summary: string | null;
  language: string;
  experiences: ExtractedExperience[];
  education: ExtractedEducation[];
  skills: ExtractedSkill[];
  projects: ExtractedProject[];
}

export interface ProfileExtractor {
  extract(cvText: string): Promise<ExtractedProfileContent>;
}
