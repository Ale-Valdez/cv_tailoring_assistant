import { describe, expect, it } from "vitest";

import { messageFromUnknown, readApiError } from "./api-error.ts";

describe("readApiError", () => {
  it("usa el mensaje de la API", async () => {
    const response = Response.json(
      { code: "analysis_failed", message: "No se pudo analizar la oferta." },
      { status: 502 },
    );

    await expect(readApiError(response)).resolves.toBe("No se pudo analizar la oferta.");
  });

  it("sustituye un cuerpo que no es el error de la API", async () => {
    const response = new Response("<html>Internal Server Error</html>", { status: 500 });

    await expect(readApiError(response)).resolves.toBe("No se pudo completar la operación.");
  });
});

describe("messageFromUnknown", () => {
  it("traduce un fallo de red", () => {
    expect(messageFromUnknown(new TypeError("Failed to fetch"), "No se pudo analizar la oferta.")).toBe(
      "No hay conexión con el servidor.",
    );
  });

  it("no muestra el detalle de una respuesta mal formada", () => {
    const error = new Error("invalid_type");
    error.name = "ZodError";

    expect(messageFromUnknown(error, "La respuesta no es válida.")).toBe("La respuesta no es válida.");
  });

  it("conserva un mensaje que ya está en español", () => {
    expect(messageFromUnknown(new Error("El PDF está vacío."), "No se pudo importar el PDF.")).toBe(
      "El PDF está vacío.",
    );
  });

  it("usa el texto de la acción si el fallo no es un error", () => {
    expect(messageFromUnknown("falló", "No se pudo confirmar el perfil.")).toBe("No se pudo confirmar el perfil.");
  });
});
