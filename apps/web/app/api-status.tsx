"use client";

import { healthResponseSchema } from "@cv-tailor/contracts";
import { useEffect, useState } from "react";

import { messageFromUnknown, readApiError } from "./api-error";

type Status = { state: "loading" } | { state: "ok" } | { state: "error"; message: string };

export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }
        const body: unknown = await response.json();
        healthResponseSchema.parse(body);
        setStatus({ state: "ok" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = messageFromUnknown(error, "La API no responde.");
        setStatus({
          state: "error",
          message: message === "La API no responde." ? message : `La API no responde. ${message}`,
        });
      });

    return () => controller.abort();
  }, []);

  if (status.state === "loading") {
    return <p className="text-sm text-neutral-500">Comprobando la API…</p>;
  }

  if (status.state === "error") {
    return (
      <p className="max-w-xs rounded-full bg-red-50 px-3 py-1 text-right text-sm text-red-800">{status.message}</p>
    );
  }

  return <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">API disponible.</p>;
}
