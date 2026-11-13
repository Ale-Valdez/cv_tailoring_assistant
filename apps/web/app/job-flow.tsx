"use client";

import {
  apiErrorSchema,
  jobMatchReportSchema,
  jobPostingSchema,
  privacyResponseSchema,
  tailoredCvSchema,
  type JobMatchReport,
  type JobPosting,
  type PrivacyResponse,
  type ReviewSuggestionRequest,
  type TailoredCv,
} from "@cv-tailor/contracts";
import { useEffect, useState } from "react";

import { ProposalPanel } from "./proposal-panel";

const KIND = { technical: "Técnico", functional: "Funcional" } as const;
const PRIORITY = { required: "Obligatorio", preferred: "Deseable" } as const;
const STATUS = { covered: "Cubierto", partial: "Parcial", gap: "Brecha" } as const;

type Ready = {
  phase: "ready";
  privacy: PrivacyResponse;
  text: string;
  busy: boolean;
  error: string | null;
  job: JobPosting | null;
  match: JobMatchReport | null;
  matchNotice: string | null;
  proposal: TailoredCv | null;
  proposalError: string | null;
};

type Flow = { phase: "loading" } | { phase: "error"; message: string } | Ready;

export function JobFlow() {
  const [attempt, setAttempt] = useState(0);
  const [flow, setFlow] = useState<Flow>({ phase: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const privacyResponse = await fetch("/api/privacy", { signal: controller.signal });
        if (!privacyResponse.ok) {
          throw new Error(`HTTP ${privacyResponse.status}`);
        }
        const privacy = privacyResponseSchema.parse(await privacyResponse.json());
        const current = await fetch("/api/jobs/current", { signal: controller.signal });
        if (!active) {
          return;
        }
        if (current.status === 404) {
          setFlow({
            phase: "ready",
            privacy,
            text: "",
            busy: false,
            error: null,
            job: null,
            match: null,
            matchNotice: null,
            proposal: null,
            proposalError: null,
          });
          return;
        }
        if (!current.ok) {
          throw new Error(await readError(current));
        }
        const job = jobPostingSchema.parse(await current.json());
        const coverage = await loadMatch(job.id);
        const proposal = await loadProposal(job.id);
        if (!active) {
          return;
        }
        setFlow({
          phase: "ready",
          privacy,
          text: job.rawText,
          busy: false,
          error: null,
          job,
          match: coverage.match,
          matchNotice: coverage.notice,
          proposal,
          proposalError: null,
        });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "No se pudo preparar la oferta.";
        setFlow({ phase: "error", message });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  if (flow.phase === "loading") {
    return <p className="text-neutral-500">Cargando la oferta…</p>;
  }

  if (flow.phase === "error") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-red-700" role="alert">
          No se pudo preparar la oferta ({flow.message}).
        </p>
        <button
          type="button"
          className="w-fit rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm"
          onClick={() => {
            setFlow({ phase: "loading" });
            setAttempt((value) => value + 1);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <section className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(flow, setFlow);
        }}
      >
        <h2 className="text-lg font-semibold">Analizar oferta</h2>
        <p className="text-sm leading-6 text-neutral-700">
          Pegá el texto de la oferta. Se envía a OpenAI para clasificar requisitos y keywords, sin traducir.{" "}
          {langsmithCopy(flow.privacy.langsmithTracing)} El máximo es {formatChars(flow.privacy.maxJobTextChars)}{" "}
          caracteres.
        </p>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Texto de la oferta</span>
          <textarea
            className="min-h-40 rounded-md border border-neutral-300 px-3 py-2"
            value={flow.text}
            maxLength={flow.privacy.maxJobTextChars}
            disabled={flow.busy}
            onChange={(event) => setFlow({ ...flow, text: event.target.value, error: null })}
          />
        </label>
        <p className="text-xs text-neutral-500">
          {formatChars(flow.text.trim().length)} / {formatChars(flow.privacy.maxJobTextChars)}
        </p>
        {flow.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {flow.error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={flow.busy}
        >
          {flow.busy ? "Analizando…" : "Analizar"}
        </button>
      </form>
      {flow.job ? (
        <>
          <JobReport
            job={flow.job}
            match={flow.match}
            matchNotice={flow.matchNotice}
            busy={flow.busy}
            onRefresh={() => {
              void refreshMatch(flow, setFlow);
            }}
          />
          <ProposalPanel
            proposal={flow.proposal}
            busy={flow.busy}
            error={flow.proposalError}
            canPropose={flow.match !== null}
            onPropose={() => {
              void propose(flow, setFlow);
            }}
            onReview={(suggestionId, body) => {
              void review(flow, setFlow, suggestionId, body);
            }}
          />
        </>
      ) : null}
    </section>
  );
}

function JobReport({
  job,
  match,
  matchNotice,
  busy,
  onRefresh,
}: {
  job: JobPosting;
  match: JobMatchReport | null;
  matchNotice: string | null;
  busy: boolean;
  onRefresh: () => void;
}) {
  const evidence = new Map(match?.citedBullets.map((bullet) => [bullet.bulletId, bullet.text]) ?? []);
  const results = new Map(match?.matchResults.map((result) => [result.requirementId, result]) ?? []);
  const counts = countResults(match);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{job.title ?? "Oferta sin título"}</h2>
        <p className="text-sm text-neutral-600">
          {[job.company, job.language].filter((part) => part !== null && part.length > 0).join(" · ") || "Sin empresa ni idioma"}
        </p>
      </header>
      {match?.languageNotice ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {match.languageNotice}
        </p>
      ) : null}
      {matchNotice ? <p className="text-sm text-neutral-700">{matchNotice}</p> : null}
      <button
        type="button"
        className="w-fit rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
        disabled={busy}
        onClick={onRefresh}
      >
        Actualizar cobertura
      </button>
      {counts ? (
        <p className="text-sm text-neutral-700">
          {counts.covered} cubiertos, {counts.partial} parciales, {counts.gap} brechas.
        </p>
      ) : null}
      <section className="flex flex-col gap-3">
        <h3 className="font-medium">Requisitos</h3>
        {job.requirements.length === 0 ? <p className="text-sm text-neutral-600">La oferta no trajo requisitos.</p> : null}
        <ul className="flex flex-col gap-3">
          {job.requirements.map((requirement) => {
            const result = results.get(requirement.id);
            return (
              <li key={requirement.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-sm">{requirement.text}</p>
                <p className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-neutral-100 px-2 py-1">{KIND[requirement.kind]}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-1">{PRIORITY[requirement.priority]}</span>
                  {result ? <span className={statusClass(result.status)}>{STATUS[result.status]}</span> : null}
                </p>
                {result?.note ? <p className="mt-2 text-sm text-neutral-700">{result.note}</p> : null}
                {result && result.evidenceBulletIds.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-700">
                    {result.evidenceBulletIds.map((bulletId) => (
                      <li key={bulletId}>«{evidence.get(bulletId) ?? bulletId}»</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="font-medium">Keywords</h3>
        {job.keywords.length === 0 ? <p className="text-sm text-neutral-600">La oferta no trajo keywords.</p> : null}
        <ul className="flex flex-col gap-3">
          {job.keywords.map((keyword) => {
            const coverage = match?.keywords.find((item) => item.keywordId === keyword.id);
            return (
              <li key={keyword.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
                <p className="font-medium">{keyword.canonical}</p>
                <p className="mt-1 text-neutral-600">
                  {keyword.aliases.length > 0 ? `Alias: ${keyword.aliases.join(", ")}. ` : ""}
                  {keyword.frequency} {keyword.frequency === 1 ? "mención" : "menciones"}.
                </p>
                {coverage ? (
                  <p className="mt-2">
                    {coverage.present
                      ? "Presente en el perfil: se puede incorporar."
                      : "Ausente: no se puede incorporar."}
                  </p>
                ) : null}
                {coverage && coverage.skillNames.length > 0 ? (
                  <p className="mt-1 text-neutral-700">Habilidades: {coverage.skillNames.join(", ")}.</p>
                ) : null}
                {coverage && coverage.evidenceBulletIds.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-1 text-neutral-700">
                    {coverage.evidenceBulletIds.map((bulletId) => (
                      <li key={bulletId}>«{evidence.get(bulletId) ?? bulletId}»</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

async function refreshMatch(flow: Ready, setFlow: (flow: Flow) => void): Promise<void> {
  if (flow.job === null) {
    return;
  }
  setFlow({ ...flow, busy: true, error: null });
  try {
    const coverage = await loadMatch(flow.job.id);
    setFlow({
      ...flow,
      busy: false,
      error: null,
      match: coverage.match,
      matchNotice: coverage.notice,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo comparar la oferta.";
    setFlow({ ...flow, busy: false, error: message });
  }
}

async function submit(flow: Ready, setFlow: (flow: Flow) => void): Promise<void> {
  const text = flow.text.trim();
  if (text.length === 0) {
    setFlow({ ...flow, error: "Pegá el texto de la oferta." });
    return;
  }
  if (text.length > flow.privacy.maxJobTextChars) {
    setFlow({
      ...flow,
      error: `La oferta supera el máximo de ${formatChars(flow.privacy.maxJobTextChars)} caracteres.`,
    });
    return;
  }
  setFlow({ ...flow, busy: true, error: null });
  try {
    const response = await fetch("/api/jobs/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      setFlow({ ...flow, busy: false, error: await readError(response) });
      return;
    }
    const parsed = jobPostingSchema.safeParse(await response.json());
    if (!parsed.success) {
      setFlow({ ...flow, busy: false, error: "La respuesta del análisis no es una oferta válida." });
      return;
    }
    const coverage = await loadMatch(parsed.data.id);
    const proposal = await loadProposal(parsed.data.id);
    setFlow({
      ...flow,
      text,
      busy: false,
      error: null,
      job: parsed.data,
      match: coverage.match,
      matchNotice: coverage.notice,
      proposal,
      proposalError: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo analizar la oferta.";
    setFlow({ ...flow, busy: false, error: message });
  }
}

async function propose(flow: Ready, setFlow: (flow: Flow) => void): Promise<void> {
  if (flow.job === null) {
    return;
  }
  setFlow({ ...flow, busy: true, proposalError: null });
  try {
    const response = await fetch(`/api/jobs/${flow.job.id}/proposals`, { method: "POST" });
    if (!response.ok) {
      setFlow({ ...flow, busy: false, proposalError: await readError(response) });
      return;
    }
    const parsed = tailoredCvSchema.safeParse(await response.json());
    if (!parsed.success) {
      setFlow({ ...flow, busy: false, proposalError: "La respuesta de la propuesta no es válida." });
      return;
    }
    setFlow({ ...flow, busy: false, proposal: parsed.data, proposalError: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudieron proponer cambios.";
    setFlow({ ...flow, busy: false, proposalError: message });
  }
}

async function review(
  flow: Ready,
  setFlow: (flow: Flow) => void,
  suggestionId: string,
  body: ReviewSuggestionRequest,
): Promise<void> {
  if (flow.proposal === null) {
    return;
  }
  setFlow({ ...flow, busy: true, proposalError: null });
  try {
    const response = await fetch(`/api/proposals/${flow.proposal.id}/suggestions/${suggestionId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setFlow({ ...flow, busy: false, proposalError: await readError(response) });
      return;
    }
    const parsed = tailoredCvSchema.safeParse(await response.json());
    if (!parsed.success) {
      setFlow({ ...flow, busy: false, proposalError: "La respuesta de la revisión no es válida." });
      return;
    }
    setFlow({ ...flow, busy: false, proposal: parsed.data, proposalError: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo revisar la sugerencia.";
    setFlow({ ...flow, busy: false, proposalError: message });
  }
}

async function loadProposal(jobId: string): Promise<TailoredCv | null> {
  const response = await fetch(`/api/jobs/${jobId}/proposal`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const parsed = tailoredCvSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("La respuesta de la propuesta no es válida.");
  }
  return parsed.data;
}

async function loadMatch(jobId: string): Promise<{ match: JobMatchReport | null; notice: string | null }> {
  const response = await fetch(`/api/jobs/${jobId}/match`);
  if (response.status === 404) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success && parsed.data.code === "profile_not_found") {
      return { match: null, notice: parsed.data.message };
    }
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const parsed = jobMatchReportSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("La respuesta de la cobertura no es válida.");
  }
  return { match: parsed.data, notice: null };
}

function countResults(match: JobMatchReport | null): { covered: number; partial: number; gap: number } | null {
  if (match === null) {
    return null;
  }
  return {
    covered: match.matchResults.filter((item) => item.status === "covered").length,
    partial: match.matchResults.filter((item) => item.status === "partial").length,
    gap: match.matchResults.filter((item) => item.status === "gap").length,
  };
}

function statusClass(status: JobMatchReport["matchResults"][number]["status"]): string {
  if (status === "covered") {
    return "rounded-full bg-emerald-50 px-2 py-1 text-emerald-900";
  }
  if (status === "partial") {
    return "rounded-full bg-amber-50 px-2 py-1 text-amber-950";
  }
  return "rounded-full bg-red-50 px-2 py-1 text-red-800";
}

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    return parsed.data.message;
  }
  return `HTTP ${response.status}`;
}

function langsmithCopy(tracing: boolean): string {
  if (tracing) {
    return "LangSmith está activo: esa llamada y su resultado también quedan guardados allí.";
  }
  return "LangSmith está apagado en este servidor.";
}

function formatChars(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}
