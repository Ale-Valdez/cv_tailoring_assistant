import { ApplicationError, MAX_CV_HTML_BYTES, type PdfGenerator } from "@cv-tailor/application";

const PDF_TIMEOUT_MS = 30_000;

export function createPdfGenerator(options: { baseUrl: string; fetch?: typeof fetch }): PdfGenerator {
  const baseUrl = options.baseUrl.trim().replace(/\/$/, "");
  if (baseUrl.length === 0) {
    throw new Error("Falta la URL del renderer.");
  }
  const fetchImpl = options.fetch ?? fetch;

  return {
    async generate(html: string): Promise<Uint8Array> {
      if (html.trim().length === 0) {
        throw new ApplicationError("invalid_html", "El HTML del CV está vacío.");
      }
      if (Buffer.byteLength(html) > MAX_CV_HTML_BYTES) {
        throw new ApplicationError("html_too_large", "El HTML del CV supera el máximo de 2 MiB.");
      }

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}/pdf`, {
          method: "POST",
          headers: { "content-type": "text/html; charset=utf-8" },
          body: html,
          signal: AbortSignal.timeout(PDF_TIMEOUT_MS),
        });
      } catch (error) {
        throw new ApplicationError("pdf_failed", "No se pudo generar el PDF.", error);
      }

      if (response.status === 400) {
        throw new ApplicationError("invalid_html", "El HTML del CV está vacío.");
      }
      if (response.status === 413) {
        throw new ApplicationError("html_too_large", "El HTML del CV supera el máximo de 2 MiB.");
      }
      if (!response.ok) {
        throw new ApplicationError("pdf_failed", "No se pudo generar el PDF.");
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!isPdf(bytes)) {
        throw new ApplicationError("pdf_failed", "No se pudo generar el PDF.");
      }
      return bytes;
    },
  };
}

function isPdf(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("utf8") === "%PDF-";
}
