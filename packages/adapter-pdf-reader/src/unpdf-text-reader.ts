import { extractText } from "unpdf";

import { ApplicationError, type PdfTextReader } from "@cv-tailor/application";

export function createUnpdfTextReader(): PdfTextReader {
  return {
    async readText(pdf: Uint8Array): Promise<string> {
      const bytes = Uint8Array.from(pdf);
      try {
        const { text } = await extractText(bytes, { mergePages: true });
        return text;
      } catch (error) {
        throw new ApplicationError("pdf_unreadable", "No se pudo leer el texto del PDF.", error);
      }
    },
  };
}
