"use client";

import { privacyResponseSchema, profileSchema, type PrivacyResponse, type Profile } from "@cv-tailor/contracts";
import { useEffect, useState } from "react";

import { messageFromUnknown, readApiError } from "./api-error";
import { ProfileEditor } from "./profile-editor";

const CONSENT_KEY = "cv-tailor.llm-consent";

type Flow =
  | { phase: "loading" }
  | { phase: "privacy-error"; message: string }
  | { phase: "consent"; privacy: PrivacyResponse }
  | { phase: "upload"; privacy: PrivacyResponse; error: string | null; busy: boolean }
  | {
      phase: "review";
      privacy: PrivacyResponse;
      profile: Profile;
      error: string | null;
      notice: string | null;
      busy: boolean;
    };

export function ImportFlow() {
  const [attempt, setAttempt] = useState(0);
  const [flow, setFlow] = useState<Flow>({ phase: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/privacy", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }
        const privacy = privacyResponseSchema.parse(await response.json());
        const saved = await fetch("/api/profiles/current", { signal: controller.signal });
        if (!active) {
          return;
        }
        if (saved.status !== 404) {
          if (!saved.ok) {
            throw new Error(await readApiError(saved));
          }
          const profile = profileSchema.parse(await saved.json());
          if (profile.status !== "confirmed") {
            throw new Error("El perfil guardado no está confirmado.");
          }
          setFlow({
            phase: "review",
            privacy,
            profile,
            error: null,
            notice: "Perfil guardado. Confirmá de nuevo si lo modificás.",
            busy: false,
          });
          return;
        }
        const accepted = window.localStorage.getItem(CONSENT_KEY) === "accepted";
        setFlow(
          accepted
            ? { phase: "upload", privacy, error: null, busy: false }
            : { phase: "consent", privacy },
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (!active) {
          return;
        }
        setFlow({ phase: "privacy-error", message: messageFromUnknown(error, "La respuesta no es válida.") });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  if (flow.phase === "loading") {
    return <p className="text-neutral-500">Cargando…</p>;
  }

  if (flow.phase === "privacy-error") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-red-700" role="alert">
          No se pudo preparar la pantalla ({flow.message}). Sin eso no se muestra el perfil ni se envía el CV.
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

  if (flow.phase === "consent") {
    return (
      <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Antes de enviar el CV</h2>
        <p className="text-sm leading-6 text-neutral-700">
          Para armar el borrador, el texto del PDF se envía a OpenAI. De ese texto se quitan emails y
          teléfonos; el nombre, la ubicación y los enlaces pueden seguir. El bloque de contacto del
          perfil queda vacío y lo completás vos.
        </p>
        <p className="text-sm leading-6 text-neutral-700">{langsmithCopy(flow.privacy.langsmithTracing)}</p>
        <button
          type="button"
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            window.localStorage.setItem(CONSENT_KEY, "accepted");
            setFlow({ phase: "upload", privacy: flow.privacy, error: null, busy: false });
          }}
        >
          Entiendo, continuar
        </button>
      </section>
    );
  }

  if (flow.phase === "upload") {
    return (
      <UploadPanel
        privacy={flow.privacy}
        error={flow.error}
        busy={flow.busy}
        onError={(error) => setFlow({ ...flow, error, busy: false })}
        onBusy={() => setFlow({ ...flow, error: null, busy: true })}
        onImported={(profile) =>
          setFlow({
            phase: "review",
            privacy: flow.privacy,
            profile,
            error: null,
            notice: null,
            busy: false,
          })
        }
      />
    );
  }

  return (
    <ProfileEditor
      profile={flow.profile}
      busy={flow.busy}
      error={flow.error}
      notice={flow.notice}
      onChange={(profile) => setFlow({ ...flow, profile, error: null, notice: null })}
      onConfirm={() => {
        void confirm(flow, setFlow);
      }}
      onImportAnother={() => {
        const discard = window.confirm(
          "Si volvés a importar, se pierde la corrección que todavía no confirmaste.",
        );
        if (!discard) {
          return;
        }
        setFlow({ phase: "upload", privacy: flow.privacy, error: null, busy: false });
      }}
    />
  );
}

function UploadPanel({
  privacy,
  error,
  busy,
  onError,
  onBusy,
  onImported,
}: {
  privacy: PrivacyResponse;
  error: string | null;
  busy: boolean;
  onError: (message: string) => void;
  onBusy: () => void;
  onImported: (profile: Profile) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (file === null) {
          onError("Elegí un PDF.");
          return;
        }
        onBusy();
        void sendPdf(file, privacy.maxPdfBytes).then(
          (result) => {
            if (result.ok) {
              onImported(result.profile);
              return;
            }
            onError(result.message);
          },
          (reason: unknown) => {
            onError(messageFromUnknown(reason, "No se pudo importar el PDF."));
          },
        );
      }}
    >
      <h2 className="text-lg font-semibold">Importar CV</h2>
      <p className="text-sm leading-6 text-neutral-700">
        El texto del CV se envía a OpenAI para extraer el borrador. {langsmithCopy(privacy.langsmithTracing)} El
        PDF tiene que tener texto seleccionable y no puede superar {formatLimit(privacy.maxPdfBytes)}.
      </p>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Archivo PDF</span>
        <input
          className="text-sm"
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={busy}
      >
        {busy ? "Importando…" : "Importar"}
      </button>
    </form>
  );
}

async function sendPdf(
  file: File,
  maxPdfBytes: number,
): Promise<{ ok: true; profile: Profile } | { ok: false; message: string }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { ok: false, message: "Elegí un PDF." };
  }
  if (file.size === 0) {
    return { ok: false, message: "El PDF está vacío." };
  }
  if (file.size > maxPdfBytes) {
    return { ok: false, message: `El PDF supera el máximo de ${formatLimit(maxPdfBytes)}.` };
  }

  const response = await fetch("/api/profiles/import", {
    method: "POST",
    headers: { "content-type": "application/pdf" },
    body: await file.arrayBuffer(),
  });
  if (!response.ok) {
    return { ok: false, message: await readApiError(response) };
  }
  const parsed = profileSchema.safeParse(await response.json());
  if (!parsed.success) {
    return { ok: false, message: "La respuesta de la importación no es un perfil válido." };
  }
  return { ok: true, profile: parsed.data };
}

async function confirm(flow: Extract<Flow, { phase: "review" }>, setFlow: (flow: Flow) => void): Promise<void> {
  setFlow({ ...flow, busy: true, error: null });
  try {
    const response = await fetch("/api/profiles/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(flow.profile),
    });
    if (!response.ok) {
      setFlow({ ...flow, busy: false, error: await readApiError(response) });
      return;
    }
    const parsed = profileSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.status !== "confirmed") {
      setFlow({ ...flow, busy: false, error: "La respuesta de la confirmación no es un perfil confirmado." });
      return;
    }
    setFlow({
      ...flow,
      profile: parsed.data,
      busy: false,
      error: null,
      notice: "Perfil confirmado y guardado.",
    });
  } catch (error: unknown) {
    setFlow({ ...flow, busy: false, error: messageFromUnknown(error, "No se pudo confirmar el perfil.") });
  }
}

function langsmithCopy(tracing: boolean): string {
  if (tracing) {
    return "LangSmith está activo: esa llamada y su resultado también quedan guardados allí.";
  }
  return "LangSmith está apagado en este servidor.";
}

function formatLimit(bytes: number): string {
  const mib = bytes / (1024 * 1024);
  return Number.isInteger(mib) ? `${mib} MiB` : `${mib.toFixed(1)} MiB`;
}
