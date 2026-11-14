"use client";

import type { ReviewSuggestionRequest, Suggestion, TailoredCv } from "@cv-tailor/contracts";
import { useState } from "react";

import { downloadLabel, exportLabel, proposeLabel, reviewLabel, type JobActivity } from "./job-activity";

const STATUS = {
  pending: "Pendiente",
  accepted: "Aceptada",
  edited: "Editada",
  rejected: "Rechazada",
} as const;

const TARGET = {
  summary: "Resumen",
  bullet: "Bullet",
  skill_order: "Orden de habilidades",
} as const;

export function ProposalPanel({
  proposal,
  previewHtml,
  previewError,
  activity,
  error,
  canPropose,
  onPropose,
  onReview,
  onExport,
  onDownload,
}: {
  proposal: TailoredCv | null;
  previewHtml: string | null;
  previewError: string | null;
  activity: JobActivity | null;
  error: string | null;
  canPropose: boolean;
  onPropose: () => void;
  onReview: (suggestionId: string, body: ReviewSuggestionRequest) => void;
  onExport: () => void;
  onDownload: (exportId: string) => void;
}) {
  return (
    <section className="grid gap-6 rounded-lg border border-neutral-200 bg-white p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
      <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Sugerencias</h2>
        <p className="text-sm leading-6 text-neutral-700">
          La propuesta usa el perfil sin datos de contacto. Solo quedan los cambios que el perfil ya respalda: se
          puede reformular, no agregar una herramienta, una empresa, una cifra o una fecha. Después aceptás, editás o
          rechazás cada una. La vista previa muestra el CV con lo ya aceptado o editado.
        </p>
      </header>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {canPropose ? (
        <button
          type="button"
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={activity !== null}
          onClick={onPropose}
        >
          {proposeLabel(activity, proposal !== null)}
        </button>
      ) : (
        <p className="text-sm text-neutral-600">Confirmá el perfil para proponer cambios.</p>
      )}
      {proposal !== null && proposal.suggestions.length === 0 ? (
        <p className="text-sm text-neutral-700">No hay cambios que se puedan proponer sin agregar datos nuevos.</p>
      ) : null}
      {proposal !== null && proposal.suggestions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {proposal.suggestions.map((suggestion) => (
            <SuggestionCard
              key={`${suggestion.id}:${suggestion.status}:${suggestion.after}`}
              cv={proposal}
              suggestion={suggestion}
              activity={activity}
              onReview={onReview}
            />
          ))}
        </ul>
      ) : null}
      {proposal !== null ? (
        <ExportBox proposal={proposal} activity={activity} onExport={onExport} onDownload={onDownload} />
      ) : null}
      </div>
      {proposal !== null ? <CvPreview html={previewHtml} error={previewError} /> : null}
    </section>
  );
}

function ExportBox({
  proposal,
  activity,
  onExport,
  onDownload,
}: {
  proposal: TailoredCv;
  activity: JobActivity | null;
  onExport: () => void;
  onDownload: (exportId: string) => void;
}) {
  const versions = [...proposal.exports].sort((left, right) => left.version - right.version);
  return (
    <div className="flex flex-col gap-2">
      {proposal.status === "final" ? (
        <button
          type="button"
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={activity !== null}
          onClick={onExport}
        >
          {exportLabel(activity)}
        </button>
      ) : (
        <p className="text-sm text-neutral-600">
          Se exporta cuando no queda ninguna sugerencia pendiente. Rechazar también alcanza: queda el texto original.
        </p>
      )}
      {versions.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {versions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="text-sm text-neutral-800 underline disabled:opacity-50"
                disabled={activity !== null}
                onClick={() => onDownload(item.id)}
              >
                {downloadLabel(activity, item.id, item.version)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CvPreview({ html, error }: { html: string | null; error: string | null }) {
  return (
    <aside className="flex flex-col gap-2 lg:sticky lg:top-6 lg:self-start">
      <h2 className="text-lg font-semibold">Vista previa</h2>
      <p className="text-sm leading-6 text-neutral-700">
        Es el mismo HTML que después se exporta. Se actualiza al aceptar, guardar una edición o rechazar. El texto del
        campo entra cuando lo guardás.
      </p>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {html !== null ? (
        <iframe
          title="Vista previa del CV"
          sandbox=""
          srcDoc={html}
          className="h-[720px] w-full rounded-md border border-neutral-200 bg-white"
        />
      ) : error === null ? (
        <p className="text-sm text-neutral-600">Cargando la vista previa…</p>
      ) : null}
    </aside>
  );
}

function SuggestionCard({
  cv,
  suggestion,
  activity,
  onReview,
}: {
  cv: TailoredCv;
  suggestion: Suggestion;
  activity: JobActivity | null;
  onReview: (suggestionId: string, body: ReviewSuggestionRequest) => void;
}) {
  const [text, setText] = useState(suggestion.after);
  const pending = suggestion.status === "pending";
  const edited = text.trim() !== suggestion.after;

  return (
    <li className="rounded-lg border border-neutral-200 p-4">
      <p className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-neutral-100 px-2 py-1">{TARGET[suggestion.target.type]}</span>
        <span className="rounded-full bg-neutral-100 px-2 py-1">{STATUS[suggestion.status]}</span>
      </p>
      <p className="mt-3 text-xs font-medium text-neutral-500">Antes</p>
      <p className="whitespace-pre-wrap text-sm text-neutral-800">{suggestion.before || "Sin texto"}</p>
      <p className="mt-3 text-xs font-medium text-neutral-500">Después</p>
      {pending ? (
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={text}
          disabled={activity !== null}
          onChange={(event) => setText(event.target.value)}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-neutral-800">{suggestion.after}</p>
      )}
      <p className="mt-3 text-sm text-neutral-700">{suggestion.reason}</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
        {suggestion.evidence.map((evidence, index) => (
          <li key={`${suggestion.id}-${index}`}>{evidenceLabel(cv, evidence)}</li>
        ))}
      </ul>
      {pending ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            disabled={activity !== null}
            onClick={() => onReview(suggestion.id, { decision: "accept" })}
          >
            {reviewLabel(activity, suggestion.id, "accept")}
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={activity !== null || !edited || text.trim().length === 0}
            onClick={() => onReview(suggestion.id, { decision: "edit", text })}
          >
            {reviewLabel(activity, suggestion.id, "edit")}
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={activity !== null}
            onClick={() => onReview(suggestion.id, { decision: "reject" })}
          >
            {reviewLabel(activity, suggestion.id, "reject")}
          </button>
        </div>
      ) : null}
    </li>
  );
}

function evidenceLabel(cv: TailoredCv, evidence: Suggestion["evidence"][number]): string {
  if (evidence.type === "summary") {
    return "Evidencia: resumen";
  }
  if (evidence.type === "bullet") {
    return `Evidencia: «${bulletText(cv, evidence.bulletId) ?? evidence.bulletId}»`;
  }
  if (evidence.type === "skill") {
    const skill = cv.snapshot.skills.find((item) => item.id === evidence.skillId);
    return `Evidencia: habilidad ${skill?.name ?? evidence.skillId}`;
  }
  if (evidence.type === "experience") {
    const experience = cv.snapshot.experiences.find((item) => item.id === evidence.experienceId);
    return experience
      ? `Evidencia: ${experience.role} en ${experience.organization}`
      : "Evidencia: experiencia";
  }
  if (evidence.type === "education") {
    const education = cv.snapshot.education.find((item) => item.id === evidence.educationId);
    return education ? `Evidencia: ${education.title}, ${education.institution}` : "Evidencia: formación";
  }
  const project = cv.snapshot.projects.find((item) => item.id === evidence.projectId);
  return project ? `Evidencia: proyecto ${project.name}` : "Evidencia: proyecto";
}

function bulletText(cv: TailoredCv, bulletId: string): string | null {
  for (const experience of cv.snapshot.experiences) {
    const bullet = experience.bullets.find((item) => item.id === bulletId);
    if (bullet !== undefined) {
      return bullet.text;
    }
  }
  for (const project of cv.snapshot.projects) {
    const bullet = project.bullets.find((item) => item.id === bulletId);
    if (bullet !== undefined) {
      return bullet.text;
    }
  }
  return null;
}
