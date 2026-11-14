import { describe, expect, it } from "vitest";

import {
  analyzeLabel,
  downloadLabel,
  exportLabel,
  matchLabel,
  proposeLabel,
  reviewLabel,
} from "./job-activity.ts";

describe("rótulos de cada acción", () => {
  it("deja el resto quieto mientras se exporta", () => {
    const activity = { kind: "export" } as const;

    expect(exportLabel(activity)).toBe("Exportando…");
    expect(analyzeLabel(activity)).toBe("Analizar");
    expect(matchLabel(activity)).toBe("Actualizar cobertura");
    expect(proposeLabel(activity, true)).toBe("Actualizar propuesta");
    expect(downloadLabel(activity, "export-1", 1)).toBe("Descargar versión 1");
  });

  it("nombra la revisión de esa sugerencia", () => {
    const activity = { kind: "review", suggestionId: "s1", decision: "edit" } as const;

    expect(reviewLabel(activity, "s1", "edit")).toBe("Guardando…");
    expect(reviewLabel(activity, "s1", "accept")).toBe("Aceptar");
    expect(reviewLabel(activity, "s2", "edit")).toBe("Guardar edición");
  });

  it("nombra la descarga de esa versión", () => {
    const activity = { kind: "download", exportId: "export-2" } as const;

    expect(downloadLabel(activity, "export-2", 2)).toBe("Descargando…");
    expect(downloadLabel(activity, "export-1", 1)).toBe("Descargar versión 1");
  });

  it("distingue proponer de actualizar", () => {
    expect(proposeLabel({ kind: "propose" }, false)).toBe("Proponiendo…");
    expect(proposeLabel({ kind: "propose" }, true)).toBe("Actualizando propuesta…");
    expect(proposeLabel(null, false)).toBe("Proponer cambios");
  });
});
