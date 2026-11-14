export type JobActivity =
  | { kind: "analyze" }
  | { kind: "match" }
  | { kind: "propose" }
  | { kind: "review"; suggestionId: string; decision: "accept" | "edit" | "reject" }
  | { kind: "export" }
  | { kind: "download"; exportId: string };

export function analyzeLabel(activity: JobActivity | null): string {
  return activity?.kind === "analyze" ? "Analizando…" : "Analizar";
}

export function matchLabel(activity: JobActivity | null): string {
  return activity?.kind === "match" ? "Actualizando cobertura…" : "Actualizar cobertura";
}

export function proposeLabel(activity: JobActivity | null, hasProposal: boolean): string {
  if (activity?.kind === "propose") {
    return hasProposal ? "Actualizando propuesta…" : "Proponiendo…";
  }
  return hasProposal ? "Actualizar propuesta" : "Proponer cambios";
}

export function reviewLabel(
  activity: JobActivity | null,
  suggestionId: string,
  decision: "accept" | "edit" | "reject",
): string {
  const idle = { accept: "Aceptar", edit: "Guardar edición", reject: "Rechazar" } as const;
  const active = { accept: "Aceptando…", edit: "Guardando…", reject: "Rechazando…" } as const;
  if (activity?.kind === "review" && activity.suggestionId === suggestionId && activity.decision === decision) {
    return active[decision];
  }
  return idle[decision];
}

export function exportLabel(activity: JobActivity | null): string {
  return activity?.kind === "export" ? "Exportando…" : "Exportar PDF";
}

export function downloadLabel(activity: JobActivity | null, exportId: string, version: number): string {
  if (activity?.kind === "download" && activity.exportId === exportId) {
    return "Descargando…";
  }
  return `Descargar versión ${version}`;
}
