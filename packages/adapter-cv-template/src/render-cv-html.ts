import type { CvHtmlRenderer } from "@cv-tailor/application";
import type { ConfirmedProfile, DateSpan, LanguageLevel } from "@cv-tailor/domain";

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
  languages: string;
  present: string;
  levels: Record<LanguageLevel, string>;
}

const SPANISH: Labels = {
  summary: "Perfil profesional",
  experience: "Experiencia profesional",
  projects: "Proyectos destacados",
  skills: "Habilidades técnicas",
  education: "Educación",
  languages: "Idiomas",
  present: "Actualidad",
  levels: {
    native: "Nativo",
    A1: "Principiante",
    A2: "Elemental",
    B1: "Intermedio",
    B2: "Intermedio alto",
    C1: "Avanzado",
    C2: "Maestría",
  },
};

const ENGLISH: Labels = {
  summary: "Professional profile",
  experience: "Professional experience",
  projects: "Selected projects",
  skills: "Technical skills",
  education: "Education",
  languages: "Languages",
  present: "Present",
  levels: {
    native: "Native",
    A1: "Beginner",
    A2: "Elementary",
    B1: "Intermediate",
    B2: "Upper intermediate",
    C1: "Advanced",
    C2: "Mastery",
  },
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
header.with-photo {
  display: flex;
  align-items: flex-start;
  gap: 12pt;
}
header.with-photo .photo {
  width: 68pt;
  height: 68pt;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
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
.contact li { display: flex; align-items: flex-start; gap: 4pt; }
.contact svg { width: 11pt; height: 11pt; margin-top: 1pt; flex: none; }
a { color: #1a4b8c; }
ul.bullets { margin: 4pt 0 0; padding-left: 1.15em; }
li { break-inside: avoid; }
h2, h3, .meta { break-after: avoid; }
`;

export function createCvHtmlRenderer(): CvHtmlRenderer {
  return { render: renderCvHtml };
}

export function renderCvHtml(profile: ConfirmedProfile): string {
  const labels = labelsFor(profile.displayLanguage);
  const months = profile.displayLanguage === "en" ? MONTHS_EN : MONTHS_ES;
  const sections = [
    summarySection(profile, labels),
    experienceSection(profile, labels, months),
    projectSection(profile, labels),
    skillSection(profile, labels),
    educationSection(profile, labels, months),
    languageSection(profile, labels),
  ].filter((section) => section.length > 0);

  return `<!DOCTYPE html>
<html lang="${profile.displayLanguage}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(profile.contact.name)}</title>
<style>${STYLES}</style>
</head>
<body>
<article class="cv">
${headerBlock(profile)}
${sections.join("\n")}
</article>
</body>
</html>
`;
}

function labelsFor(language: "es" | "en"): Labels {
  return language === "en" ? ENGLISH : SPANISH;
}

function headerBlock(profile: ConfirmedProfile): string {
  const heading = `<h1>${escapeHtml(profile.contact.name)}</h1>${contactList(profile)}`;
  const photo = profile.contact.photo;
  if (photo === null) {
    return `<header>${heading}</header>`;
  }
  return `<header class="with-photo"><img class="photo" alt="" src="${escapeHtml(photo)}"><div>${heading}</div></header>`;
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

function languageSection(profile: ConfirmedProfile, labels: Labels): string {
  if (profile.spokenLanguages.length === 0) {
    return "";
  }
  const lines = profile.spokenLanguages.map((spoken) => `<p>${escapeHtml(formatSpokenLanguage(spoken.language, spoken.level, labels))}</p>`);
  return `<section><h2>${labels.languages}</h2>${lines.join("")}</section>`;
}

function formatSpokenLanguage(language: string, level: LanguageLevel, labels: Labels): string {
  const word = labels.levels[level];
  if (level === "native") {
    return `${language} · ${word}`;
  }
  return `${language} · ${level} · ${word}`;
}

function contactList(profile: ConfirmedProfile): string {
  const items: string[] = [];
  if (profile.contact.phone !== null) {
    items.push(contactItem("phone", escapeHtml(profile.contact.phone)));
  }
  if (profile.contact.email !== null) {
    const email = escapeHtml(profile.contact.email);
    items.push(contactItem("email", `<a href="mailto:${email}">${email}</a>`));
  }
  for (const link of profile.contact.links) {
    items.push(contactItem(iconForUrl(link.url), linkBody(link)));
  }
  if (profile.contact.location !== null) {
    items.push(contactItem("location", escapeHtml(profile.contact.location), true));
  }
  if (items.length === 0) {
    return "";
  }
  return `<ul class="contact">${items.join("")}</ul>`;
}

function contactItem(icon: ContactIcon, body: string, full = false): string {
  const klass = full ? ` class="full"` : "";
  return `<li${klass}>${contactIcon(icon)}<span>${body}</span></li>`;
}

function linkBody(link: { label: string; url: string }): string {
  const href = escapeHtml(link.url);
  const label = escapeHtml(link.label);
  const shown = displayUrl(link.url);
  const extra = link.label === link.url || link.label === shown ? "" : ` · ${escapeHtml(shown)}`;
  return `<a href="${href}">${label}</a>${extra}`;
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

type ContactIcon =
  | "phone"
  | "email"
  | "location"
  | "link"
  | "linkedin"
  | "github"
  | "instagram"
  | "whatsapp"
  | "telegram"
  | "x"
  | "facebook"
  | "youtube";

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

function contactIcon(name: ContactIcon): string {
  return `<svg data-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_MARK[name]}</svg>`;
}

function iconForUrl(url: string): ContactIcon {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url.trim());
  const hostPort = match?.[1]?.toLowerCase() ?? "";
  const host = hostPort.replace(/^www\./, "").split(":")[0] ?? "";
  if (host.length === 0) {
    return "link";
  }
  if (matchesHost(host, ["linkedin.com"])) {
    return "linkedin";
  }
  if (matchesHost(host, ["github.com"])) {
    return "github";
  }
  if (matchesHost(host, ["instagram.com"])) {
    return "instagram";
  }
  if (host === "wa.me" || matchesHost(host, ["whatsapp.com"])) {
    return "whatsapp";
  }
  if (host === "t.me" || host === "telegram.me" || matchesHost(host, ["telegram.org"])) {
    return "telegram";
  }
  if (host === "x.com" || matchesHost(host, ["twitter.com"])) {
    return "x";
  }
  if (matchesHost(host, ["facebook.com", "fb.com"])) {
    return "facebook";
  }
  if (host === "youtu.be" || matchesHost(host, ["youtube.com"])) {
    return "youtube";
  }
  return "link";
}

function matchesHost(host: string, names: readonly string[]): boolean {
  return names.some((name) => host === name || host.endsWith(`.${name}`));
}

const ICON_MARK: Record<ContactIcon, string> = {
  phone: `<path ${STROKE} d="M8 3h3l1.4 3.6-1.8 1.1a12 12 0 0 0 5.7 5.7l1.1-1.8L21 13v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>`,
  email: `<rect ${STROKE} x="3" y="5" width="18" height="14" rx="2"/><path ${STROKE} d="M3 7l9 6 9-6"/>`,
  location: `<path ${STROKE} d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z"/><circle ${STROKE} cx="12" cy="11" r="1.6"/>`,
  link: `<path ${STROKE} d="M10 13a5 5 0 0 0 7.1.1l1.4-1.5a5 5 0 0 0-7.1-7.1L10.2 5.7"/><path ${STROKE} d="M14 11a5 5 0 0 0-7.1-.1l-1.4 1.5a5 5 0 0 0 7.1 7.1l1.2-1.2"/>`,
  linkedin: `<rect ${STROKE} x="3" y="3" width="18" height="18" rx="2"/><path ${STROKE} d="M8 10v7M8 7.5h.01M12 17v-4a2 2 0 0 1 4 0v4"/>`,
  github: `<path ${STROKE} d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.2a2.8 2.8 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-6a4.6 4.6 0 0 0-1.2-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.8 2.7 5.8 3 5.8 3a4.3 4.3 0 0 0-.1 3.2 4.6 4.6 0 0 0-1.2 3.2c0 4.6 2.7 5.7 5.3 6a2.8 2.8 0 0 0-.8 2.2V21"/>`,
  instagram: `<rect ${STROKE} x="4" y="4" width="16" height="16" rx="5"/><circle ${STROKE} cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor"/>`,
  whatsapp: `<path ${STROKE} d="M5 19l1.2-3.6A8 8 0 1 1 8.6 18.2L5 19z"/><path ${STROKE} d="M9 10c.3 1.6 2.4 3.2 4 3.5"/>`,
  telegram: `<path ${STROKE} d="M21 4L3 11.2l6.2 2.2L17 8l-6 6.2V20l2.6-3.4L17 18z"/>`,
  x: `<path ${STROKE} d="M5 5l14 14M19 5L5 19"/>`,
  facebook: `<path ${STROKE} d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1z"/>`,
  youtube: `<rect ${STROKE} x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.5v5l4.5-2.5z" fill="currentColor"/>`,
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
