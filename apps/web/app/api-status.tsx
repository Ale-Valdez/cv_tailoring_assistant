"use client";

import { healthResponseSchema } from "@cv-tailor/contracts";
import { useEffect, useState } from "react";

type Status = { state: "loading" } | { state: "ok" } | { state: "error"; message: string };

export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const body: unknown = await response.json();
        healthResponseSchema.parse(body);
        setStatus({ state: "ok" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = error instanceof Error ? error.message : "Error desconocido";
        setStatus({ state: "error", message });
      });

    return () => controller.abort();
  }, []);

  if (status.state === "loading") {
    return <p className="text-neutral-500">Comprobando la API…</p>;
  }

  if (status.state === "error") {
    return <p className="text-red-700">La API no responde ({status.message}).</p>;
  }

  return <p className="text-emerald-700">API disponible.</p>;
}
