"use client";

import type {
  Bullet,
  ContactLink,
  DateSpan,
  Experience,
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
  function edit(next: Profile) {
    onChange({ ...next, status: "needs_review" });
  }

  return (
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

      <Section title="Contacto">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Nombre"
            value={profile.contact.name}
            disabled={busy}
            onChange={(name) => edit({ ...profile, contact: { ...profile.contact, name } })}
          />
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
      </Section>

      <Section title="Resumen">
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

      <Section title="Idioma">
        <Field
          label="Etiqueta"
          value={profile.language}
          disabled={busy}
          onChange={(language) => edit({ ...profile, language })}
        />
        <p className="text-sm text-neutral-500">Una etiqueta corta, por ejemplo es o en.</p>
      </Section>

      <Section title="Experiencia">
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

      <Section title="Formación">
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

      <Section title="Habilidades">
        <SkillsEditor
          skills={profile.skills}
          disabled={busy}
          onChange={(skills) => edit({ ...profile, skills })}
        />
      </Section>

      <Section title="Proyectos">
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
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
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

function replaceAt<T>(items: readonly T[], index: number, next: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}

function blankToNull(value: string): string | null {
  return value.trim().length > 0 ? value : null;
}
