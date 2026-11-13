import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "@cv-tailor/application";

import { createUnpdfTextReader } from "./unpdf-text-reader.ts";

async function pdfWithText(text: string | null): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage();
  if (text !== null) {
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText(text, { x: 50, y: 700, size: 12, font });
  }
  return document.save();
}

describe("createUnpdfTextReader", () => {
  const reader = createUnpdfTextReader();

  it("extrae el texto de un PDF", async () => {
    const pdf = await pdfWithText("Experiencia en TypeScript desde 2020.");
    const text = await reader.readText(pdf);
    expect(text).toContain("TypeScript");
    expect(text).toContain("2020");
  });

  it("devuelve texto vacío si la página no tiene texto", async () => {
    const pdf = await pdfWithText(null);
    const text = await reader.readText(pdf);
    expect(text.trim()).toBe("");
  });

  it("avisa cuando el archivo no es un PDF", async () => {
    await expect(reader.readText(new Uint8Array([1, 2, 3]))).rejects.toMatchObject({
      name: "ApplicationError",
      code: "pdf_unreadable",
    });
    await expect(reader.readText(new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(ApplicationError);
  });
});
