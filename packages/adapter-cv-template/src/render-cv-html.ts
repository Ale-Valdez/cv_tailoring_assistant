import type { CvHtmlRenderer } from "@cv-tailor/application";
import type { ConfirmedProfile, DateSpan } from "@cv-tailor/domain";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Labels {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  present: string;
}

const SPANISH: Labels = {
  summary: "Perfil profesional",
  experience: "Experiencia profesional",
  projects: "Proyectos destacados",
  skills: "Habilidades técnicas",
  education: "Educación",
  present: "Actualidad",
};

const ENGLISH: Labels = {
  summary: "Professional profile",
  experience: "Professional experience",
  projects: "Selected projects",
  skills: "Technical skills",
  education: "Education",
  present: "Present",
};

const STYLES = `
@page { size: A4; margin: 14mm 16mm; }
* { box-sizing: border-box; }
html { color: #1a1a1a; }
body {
  margin: 0;
  font-family: "Liberation Sans", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.35;
}
h1 {
  margin: 0;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
h2 {
  margin: 14pt 0 6pt;
  padding-bottom: 1pt;
  border-bottom: 1.5pt solid #1a4b8c;
  color: #1a4b8c;
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
h3 { margin: 8pt 0 0; font-size: 11pt; }
p { margin: 4pt 0 0; }
.meta { margin: 0; font-style: italic; }
.contact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1pt 16pt;
  margin: 8pt 0 0;
  padding: 0;
  list-style: none;
}
.contact .full { grid-column: 1 / -1; }
a { color: #1a4b8c; }
ul.bullets { margin: 4pt 0 0; padding-left: 1.15em; }
li { break-inside: avoid; }
h2, h3, .meta { break-after: avoid; }
`;

export function createCvHtmlRenderer(): CvHtmlRenderer {
  return { render: renderCvHtml };
}

export function renderCvHtml(profile: ConfirmedProfile): string {
  const labels = labelsFor(profile.language);
  const months = profile.language.trim().toLowerCase().startsWith("en") ? MONTHS_EN : MONTHS_ES;
  const sections = [
    summarySection(profile, labels),
    experienceSection(profile, labels, months),
    projectSection(profile, labels),
    skillSection(profile, labels),
    educationSection(profile, labels, months),
  ].filter((section) => section.length > 0);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(profile.language)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(profile.contact.name)}</title>
<style>${STYLES}</style>
</head>
<body>
<article class="cv">
<header>
<h1>${escapeHtml(profile.contact.name)}</h1>
${contactList(profile)}
</header>
${sections.join("\n")}
</article>
</body>
</html>
`;
}

function labelsFor(language: string): Labels {
  return language.trim().toLowerCase().startsWith("en") ? ENGLISH : SPANISH;
}

function summarySection(profile: ConfirmedProfile, labels: Labels): string {
  if (profile.summary === null) {
    return "";
  }
  const paragraphs = profile.summary
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => `<p>${inlineText(part)}</p>`);
  if (paragraphs.length === 0) {
    return "";
  }
  return `<section><h2>${labels.summary}</h2>${paragraphs.join("")}</section>`;
}

function experienceSection(profile: ConfirmedProfile, labels: Labels, months: readonly string[]): string {
  if (profile.experiences.length === 0) {
    return "";
  }
  const jobs = profile.experiences.map((experience) => {
    const when = [formatSpan(experience.span, months, labels.present), experience.location]
      .filter((part): part is string => part !== null && part.length > 0)
      .join(" · ");
    const meta = when.length > 0 ? `<p class="meta">${escapeHtml(when)}</p>` : "";
    return `<article><h3>${escapeHtml(experience.role)} | ${escapeHtml(experience.organization)}</h3>${meta}${bulletList(experience.bullets.map((bullet) => bullet.text))}</article>`;
  });
  return `<section><h2>${labels.experience}</h2>${jobs.join("")}</section>`;
}

function projectSection(profile: ConfirmedProfile, labels: Labels): string {
  if (profile.projects.length === 0) {
    return "";
  }
  const projects = profile.projects.map((project) => {
    const url = project.url === null ? "" : `<p class="meta"><a href="${escapeHtml(project.url)}">${escapeHtml(displayUrl(project.url))}</a></p>`;
    const description = project.description === null ? "" : `<p>${inlineText(project.description)}</p>`;
    return `<article><h3>${escapeHtml(project.name)}</h3>${url}${description}${bulletList(project.bullets.map((bullet) => bullet.text))}</article>`;
  });
  return `<section><h2>${labels.projects}</h2>${projects.join("")}</section>`;
}

function skillSection(profile: ConfirmedProfile, labels: Labels): string {
  if (profile.skills.length === 0) {
    return "";
  }
  const names = profile.skills.map((skill) => skill.name).join(", ");
  return `<section><h2>${labels.skills}</h2><p>${escapeHtml(names)}.</p></section>`;
}

function educationSection(profile: ConfirmedProfile, labels: Labels, months: readonly string[]): string {
  if (profile.education.length === 0) {
    return "";
  }
  const items = profile.education.map((item) => {
    const when = formatSpan(item.span, months, labels.present);
    const meta = [item.institution, when]
      .filter((part): part is string => part !== null && part.length > 0)
      .join(" | ");
    const line = meta.length > 0 ? `<p class="meta">${escapeHtml(meta)}</p>` : "";
    return `<article><h3>${escapeHtml(item.title)}</h3>${line}</article>`;
  });
  return `<section><h2>${labels.education}</h2>${items.join("")}</section>`;
}

function contactList(profile: ConfirmedProfile): string {
  const items: string[] = [];
  if (profile.contact.phone !== null) {
    items.push(`<li>${escapeHtml(profile.contact.phone)}</li>`);
  }
  if (profile.contact.email !== null) {
    const email = escapeHtml(profile.contact.email);
    items.push(`<li><a href="mailto:${email}">${email}</a></li>`);
  }
  for (const link of profile.contact.links) {
    items.push(`<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`);
  }
  if (profile.contact.location !== null) {
    items.push(`<li class="full">${escapeHtml(profile.contact.location)}</li>`);
  }
  if (items.length === 0) {
    return "";
  }
  return `<ul class="contact">${items.join("")}</ul>`;
}

function bulletList(texts: readonly string[]): string {
  if (texts.length === 0) {
    return "";
  }
  const items = texts.map((text) => `<li>${bulletText(text)}</li>`);
  return `<ul class="bullets">${items.join("")}</ul>`;
}

function bulletText(text: string): string {
  const match = /^([^:\n]{1,60}):\s+(\S[\s\S]*)$/.exec(text.trim());
  if (match === null) {
    return inlineText(text);
  }
  const label = match[1] ?? "";
  const rest = match[2] ?? "";
  return `<strong>${escapeHtml(label)}:</strong> ${inlineText(rest)}`;
}

function formatSpan(span: DateSpan, months: readonly string[], present: string): string | null {
  const start = formatMonth(span.start, months);
  const end = span.ongoing ? present : formatMonth(span.end, months);
  if (start === null && end === null) {
    return null;
  }
  if (start === null) {
    return end;
  }
  if (end === null) {
    return start;
  }
  return `${start} – ${end}`;
}

function formatMonth(value: string | null, months: readonly string[]): string | null {
  if (value === null) {
    return null;
  }
  const year = value.slice(0, 4);
  const monthIndex = Number(value.slice(5, 7)) - 1;
  const month = months[monthIndex];
  if (month === undefined) {
    return value;
  }
  return `${month[0]?.toUpperCase() ?? ""}${month.slice(1)} ${year}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function inlineText(value: string): string {
  return escapeHtml(value.trim()).replaceAll("\n", "<br>");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
