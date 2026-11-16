"use client";

import type {
  Bullet,
  ContactLink,
  DateSpan,
  Experience,
  LanguageLevel,
  Profile,
  Project,
  SkillEntry,
  SkillSource,
} from "@cv-tailor/contracts";
import { useState, type ReactNode } from "react";

import { declaredSkill, emptyBullet, emptyEducation, emptyExperience, emptyLink, emptyProject } from "./profile-draft";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:bg-neutral-100";
const buttonClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50";
const removeClass = "text-sm text-red-700 underline-offset-2 hover:underline disabled:opacity-50";

const PROFILE_SECTIONS = [
  { id: "contacto", title: "Contacto" },
  { id: "resumen", title: "Resumen" },
  { id: "idioma", title: "Idioma" },
  { id: "idiomas", title: "Idiomas hablados" },
  { id: "experiencia", title: "Experiencia" },
  { id: "formacion", title: "Formación" },
  { id: "habilidades", title: "Habilidades" },
  { id: "proyectos", title: "Proyectos" },
] as const;

const LANGUAGE_LEVELS: { value: LanguageLevel; label: string }[] = [
  { value: "native", label: "Nativo" },
  { value: "A1", label: "A1 · Principiante" },
  { value: "A2", label: "A2 · Elemental" },
  { value: "B1", label: "B1 · Intermedio" },
  { value: "B2", label: "B2 · Intermedio alto" },
  { value: "C1", label: "C1 · Avanzado" },
  { value: "C2", label: "C2 · Maestría" },
];

const MAX_PHOTO_BYTES = 1024 * 1024;

export function ProfileEditor({
  profile,
  busy,
  error,
  notice,
  onChange,
  onConfirm,
  onImportAnother,
}: {
  profile: Profile;
  busy: boolean;
  error: string | null;
  notice: string | null;
  onChange: (profile: Profile) => void;
  onConfirm: () => void;
  onImportAnother: () => void;
}) {
  const [photoError, setPhotoError] = useState<string | null>(null);

  function edit(next: Profile) {
    onChange({ ...next, status: "needs_review" });
  }

  function onPhotoSelected(file: File | undefined) {
    if (file === undefined) {
      return;
    }
    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
      setPhotoError("La foto tiene que ser JPEG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("La foto supera 1 MiB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setPhotoError("No se pudo leer la foto.");
        return;
      }
      setPhotoError(null);
      edit({ ...profile, contact: { ...profile.contact, photo: reader.result } });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav
        aria-label="Bloques del perfil"
        className="flex flex-wrap gap-x-4 gap-y-2 lg:sticky lg:top-20 lg:flex-col"
      >
        {PROFILE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-sm text-neutral-700 underline-offset-2 hover:underline"
          >
            {section.title}
          </a>
        ))}
      </nav>
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          Estado:{" "}
          <span className="font-medium text-neutral-900">
            {profile.status === "confirmed" ? "Confirmado" : "Pendiente de revisión"}
          </span>
        </p>
        <button type="button" className={buttonClass} disabled={busy} onClick={onImportAnother}>
          Importar otro PDF
        </button>
      </div>

      <p className="text-sm text-neutral-600">
        Revisá cada dato. El nombre y el contacto no salen del PDF. Confirmá para guardar: lo que
        no confirmes se pierde al recargar.
      </p>

      <Section id="contacto" title="Contacto">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Field
              label="Nombre"
              value={profile.contact.name}
              disabled={busy}
              onChange={(name) => edit({ ...profile, contact: { ...profile.contact, name } })}
            />
            {isSingleWordName(profile.contact.name) ? (
              <p className="text-sm text-amber-950">
                El nombre tiene una sola palabra. El PDF imprime ese texto tal cual.
              </p>
            ) : null}
          </div>
          <Field
            label="Email"
            value={profile.contact.email ?? ""}
            disabled={busy}
            onChange={(email) =>
              edit({
                ...profile,
                contact: { ...profile.contact, email: email.trim().length > 0 ? email : null },
              })
            }
          />
          <Field
            label="Teléfono"
            value={profile.contact.phone ?? ""}
            disabled={busy}
            onChange={(phone) =>
              edit({
                ...profile,
                contact: { ...profile.contact, phone: phone.trim().length > 0 ? phone : null },
              })
            }
          />
          <Field
            label="Ubicación"
            value={profile.contact.location ?? ""}
            disabled={busy}
            onChange={(location) =>
              edit({
                ...profile,
                contact: {
                  ...profile.contact,
                  location: location.trim().length > 0 ? location : null,
                },
              })
            }
          />
        </div>
        <LinksEditor
          links={profile.contact.links}
          disabled={busy}
          onChange={(links) => edit({ ...profile, contact: { ...profile.contact, links } })}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Foto de perfil</span>
          <p className="text-sm text-neutral-500">
            Opcional. JPEG, PNG o WebP, hasta 1 MiB. En el PDF sale circular y no se envía al modelo.
          </p>
          {profile.contact.photo ? (
            <img
              src={profile.contact.photo}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              aria-label="Foto de perfil"
              className="text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                onPhotoSelected(file);
              }}
            />
            {profile.contact.photo ? (
              <button
                type="button"
                className={removeClass}
                disabled={busy}
                onClick={() => {
                  setPhotoError(null);
                  edit({ ...profile, contact: { ...profile.contact, photo: null } });
                }}
              >
                Quitar foto
              </button>
            ) : null}
          </div>
          {photoError ? (
            <p className="text-sm text-red-700" role="alert">
              {photoError}
            </p>
          ) : null}
        </div>
      </Section>

      <Section id="resumen" title="Resumen">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Texto</span>
          <textarea
            className={`${inputClass} min-h-24`}
            value={profile.summary ?? ""}
            disabled={busy}
            onChange={(event) => {
              const summary = event.target.value.trim().length > 0 ? event.target.value : null;
              edit({ ...profile, summary });
            }}
          />
        </label>
      </Section>

      <Section id="idioma" title="Idioma">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Idioma del texto"
            value={profile.language}
            disabled={busy}
            onChange={(language) => edit({ ...profile, language })}
          />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Idioma del CV</span>
            <select
              className={inputClass}
              value={profile.displayLanguage}
              disabled={busy}
              onChange={(event) =>
                edit({
                  ...profile,
                  displayLanguage: event.target.value === "en" ? "en" : "es",
                })
              }
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-neutral-500">
          El idioma del texto es el del CV escrito, por ejemplo es. El idioma del CV cambia los rótulos y los meses, y no traduce el contenido.
        </p>
      </Section>

      <Section id="idiomas" title="Idiomas hablados">
        <p className="text-sm text-neutral-500">
          Opcional. Español nativo e inglés B1 son dos filas. No se inventan al importar el PDF.
        </p>
        <SpokenLanguagesEditor
          languages={profile.spokenLanguages}
          disabled={busy}
          onChange={(spokenLanguages) => edit({ ...profile, spokenLanguages })}
        />
      </Section>

      <Section id="experiencia" title="Experiencia">
        {profile.experiences.map((experience, index) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            disabled={busy}
            onChange={(next) =>
              edit({ ...profile, experiences: replaceAt(profile.experiences, index, next) })
            }
            onRemove={() =>
              edit({
                ...profile,
                experiences: profile.experiences.filter((item) => item.id !== experience.id),
              })
            }
          />
        ))}
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => edit({ ...profile, experiences: [...profile.experiences, emptyExperience()] })}
        >
          Agregar experiencia
        </button>
      </Section>

      <Section id="formacion" title="Formación">
        {profile.education.map((education, index) => (
          <article key={education.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Institución"
                value={education.institution}
                disabled={busy}
                onChange={(institution) =>
                  edit({ ...profile, education: replaceAt(profile.education, index, { ...education, institution }) })
                }
              />
              <Field
                label="Título"
                value={education.title}
                disabled={busy}
                onChange={(title) =>
                  edit({ ...profile, education: replaceAt(profile.education, index, { ...education, title }) })
                }
              />
            </div>
            <SpanFields
              span={education.span}
              disabled={busy}
              onChange={(span) =>
                edit({ ...profile, education: replaceAt(profile.education, index, { ...education, span }) })
              }
            />
            <button
              type="button"
              className={removeClass}
              disabled={busy}
              onClick={() =>
                edit({ ...profile, education: profile.education.filter((item) => item.id !== education.id) })
              }
            >
              Quitar formación
            </button>
          </article>
        ))}
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => edit({ ...profile, education: [...profile.education, emptyEducation()] })}
        >
          Agregar formación
        </button>
      </Section>

      <Section id="habilidades" title="Habilidades">
        <SkillsEditor
          skills={profile.skills}
          disabled={busy}
          onChange={(skills) => edit({ ...profile, skills })}
        />
      </Section>

      <Section id="proyectos" title="Proyectos">
        {profile.projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            disabled={busy}
            onChange={(next) => edit({ ...profile, projects: replaceAt(profile.projects, index, next) })}
            onRemove={() =>
              edit({ ...profile, projects: profile.projects.filter((item) => item.id !== project.id) })
            }
          />
        ))}
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => edit({ ...profile, projects: [...profile.projects, emptyProject()] })}
        >
          Agregar proyecto
        </button>
      </Section>

      {notice ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={busy}
      >
        {busy ? "Confirmando…" : "Confirmar perfil"}
      </button>
    </form>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className={inputClass} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SpanFields({
  span,
  disabled,
  onChange,
}: {
  span: DateSpan;
  disabled: boolean;
  onChange: (span: DateSpan) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Inicio</span>
        <input
          className={inputClass}
          type="month"
          value={span.start ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...span, start: blankToNull(event.target.value) })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Fin</span>
        <input
          className={inputClass}
          type="month"
          value={span.ongoing ? "" : (span.end ?? "")}
          disabled={disabled || span.ongoing}
          onChange={(event) => onChange({ ...span, end: blankToNull(event.target.value) })}
        />
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={span.ongoing}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...span, ongoing: event.target.checked, end: event.target.checked ? null : span.end })
          }
        />
        En curso
      </label>
    </div>
  );
}

function SpokenLanguagesEditor({
  languages,
  disabled,
  onChange,
}: {
  languages: Profile["spokenLanguages"];
  disabled: boolean;
  onChange: (languages: Profile["spokenLanguages"]) => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<LanguageLevel>("B1");

  return (
    <div className="flex flex-col gap-3">
      {languages.map((spoken, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field
            label="Idioma"
            value={spoken.language}
            disabled={disabled}
            onChange={(language) => onChange(replaceAt(languages, index, { ...spoken, language }))}
          />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Nivel</span>
            <select
              className={inputClass}
              value={spoken.level}
              disabled={disabled}
              aria-label={`Nivel de ${spoken.language}`}
              onChange={(event) =>
                onChange(
                  replaceAt(languages, index, {
                    ...spoken,
                    level: event.target.value as LanguageLevel,
                  }),
                )
              }
            >
              {LANGUAGE_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`${removeClass} sm:self-end sm:pb-2`}
            disabled={disabled}
            onClick={() => onChange(languages.filter((_, itemIndex) => itemIndex !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid grow gap-1 text-sm">
          <span className="font-medium">Nuevo idioma</span>
          <input
            className={inputClass}
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nivel</span>
          <select
            className={inputClass}
            value={level}
            disabled={disabled}
            aria-label="Nivel del idioma nuevo"
            onChange={(event) => setLevel(event.target.value as LanguageLevel)}
          >
            {LANGUAGE_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || name.trim().length === 0}
          onClick={() => {
            onChange([...languages, { language: name.trim(), level }]);
            setName("");
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

function LinksEditor({
  links,
  disabled,
  onChange,
}: {
  links: readonly ContactLink[];
  disabled: boolean;
  onChange: (links: ContactLink[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {links.map((link, index) => (
        <div key={`${link.label}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field
            label="Etiqueta"
            value={link.label}
            disabled={disabled}
            onChange={(label) => onChange(replaceAt(links, index, { ...link, label }))}
          />
          <Field
            label="URL"
            value={link.url}
            disabled={disabled}
            onChange={(url) => onChange(replaceAt(links, index, { ...link, url }))}
          />
          <button
            type="button"
            className={`${removeClass} sm:self-end sm:pb-2`}
            disabled={disabled}
            onClick={() => onChange(links.filter((_, linkIndex) => linkIndex !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className={buttonClass} disabled={disabled} onClick={() => onChange([...links, emptyLink()])}>
        Agregar enlace
      </button>
    </div>
  );
}

function ExperienceCard({
  experience,
  disabled,
  onChange,
  onRemove,
}: {
  experience: Experience;
  disabled: boolean;
  onChange: (experience: Experience) => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Organización"
          value={experience.organization}
          disabled={disabled}
          onChange={(organization) => onChange({ ...experience, organization })}
        />
        <Field
          label="Rol"
          value={experience.role}
          disabled={disabled}
          onChange={(role) => onChange({ ...experience, role })}
        />
        <Field
          label="Ubicación"
          value={experience.location ?? ""}
          disabled={disabled}
          onChange={(location) => onChange({ ...experience, location: blankToNull(location) })}
        />
      </div>
      <SpanFields span={experience.span} disabled={disabled} onChange={(span) => onChange({ ...experience, span })} />
      <BulletsEditor
        bullets={experience.bullets}
        disabled={disabled}
        onChange={(bullets) => onChange({ ...experience, bullets })}
      />
      <button type="button" className={removeClass} disabled={disabled} onClick={onRemove}>
        Quitar experiencia
      </button>
    </article>
  );
}

function ProjectCard({
  project,
  disabled,
  onChange,
  onRemove,
}: {
  project: Project;
  disabled: boolean;
  onChange: (project: Project) => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre" value={project.name} disabled={disabled} onChange={(name) => onChange({ ...project, name })} />
        <Field
          label="URL"
          value={project.url ?? ""}
          disabled={disabled}
          onChange={(url) => onChange({ ...project, url: blankToNull(url) })}
        />
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Descripción</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={project.description ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...project, description: blankToNull(event.target.value) })}
        />
      </label>
      <BulletsEditor
        bullets={project.bullets}
        disabled={disabled}
        onChange={(bullets) => onChange({ ...project, bullets })}
      />
      <button type="button" className={removeClass} disabled={disabled} onClick={onRemove}>
        Quitar proyecto
      </button>
    </article>
  );
}

function BulletsEditor({
  bullets,
  disabled,
  onChange,
}: {
  bullets: readonly Bullet[];
  disabled: boolean;
  onChange: (bullets: Bullet[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Bullets</span>
      {bullets.map((bullet, index) => (
        <div key={bullet.id} className="flex items-start gap-2">
          <textarea
            className={`${inputClass} min-h-16`}
            value={bullet.text}
            disabled={disabled}
            aria-label={`Bullet ${index + 1}`}
            onChange={(event) => onChange(replaceAt(bullets, index, { ...bullet, text: event.target.value }))}
          />
          <button
            type="button"
            className={removeClass}
            disabled={disabled}
            onClick={() => onChange(bullets.filter((item) => item.id !== bullet.id))}
          >
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className={buttonClass} disabled={disabled} onClick={() => onChange([...bullets, emptyBullet()])}>
        Agregar bullet
      </button>
    </div>
  );
}

function SkillsEditor({
  skills,
  disabled,
  onChange,
}: {
  skills: readonly SkillEntry[];
  disabled: boolean;
  onChange: (skills: SkillEntry[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {skills.map((skill, index) => (
        <div key={skill.id} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field
            label="Nombre"
            value={skill.name}
            disabled={disabled}
            onChange={(name) => onChange(replaceAt(skills, index, { ...skill, name }))}
          />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Origen</span>
            <select
              className={inputClass}
              value={skill.source}
              disabled={disabled}
              onChange={(event) =>
                onChange(replaceAt(skills, index, { ...skill, source: event.target.value as SkillSource }))
              }
            >
              <option value="extracted_from_cv">Extraída del CV</option>
              <option value="declared_by_user">Declarada por vos</option>
            </select>
          </label>
          <button
            type="button"
            className={`${removeClass} sm:self-end sm:pb-2`}
            disabled={disabled}
            onClick={() => onChange(skills.filter((item) => item.id !== skill.id))}
          >
            Quitar
          </button>
        </div>
      ))}
      <AddSkill disabled={disabled} onAdd={(name) => onChange([...skills, declaredSkill(name)])} />
    </div>
  );
}

function AddSkill({ disabled, onAdd }: { disabled: boolean; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid grow gap-1 text-sm">
        <span className="font-medium">Nueva habilidad</span>
        <input className={inputClass} value={name} disabled={disabled} onChange={(event) => setName(event.target.value)} />
      </label>
      <button
        type="button"
        className={buttonClass}
        disabled={disabled || name.trim().length === 0}
        onClick={() => {
          onAdd(name.trim());
          setName("");
        }}
      >
        Agregar
      </button>
    </div>
  );
}

function isSingleWordName(name: string): boolean {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0);
  return words.length === 1;
}

function replaceAt<T>(items: readonly T[], index: number, next: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}

function blankToNull(value: string): string | null {
  return value.trim().length > 0 ? value : null;
}
