import { confirmProfile, DomainError } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import type { PdfTextReader } from "../ports/pdf-text-reader.ts";
import type { ExtractedProfileContent, ProfileExtractor } from "../ports/profile-extractor.ts";
import { importProfileFromPdf, MAX_PDF_BYTES } from "./import-profile-from-pdf.ts";

const cvText = "Ada ada@example.com\nExperiencia en TypeScript desde 2020. Tel +54 11 5555 1234.";

function readerReturning(text: string): PdfTextReader & { calls: number } {
  return {
    calls: 0,
    async readText() {
      this.calls += 1;
      return text;
    },
  };
}

function extractorReturning(content: ExtractedProfileContent): ProfileExtractor & { received: string[] } {
  const received: string[] = [];
  return {
    received,
    async extract(text: string) {
      received.push(text);
      return content;
    },
  };
}

function extractedContent(): ExtractedProfileContent {
  return {
    summary: "Desarrolla servicios.",
    language: "es",
    experiences: [
      {
        organization: "Analytical Engines",
        role: "Desarrolladora",
        span: { start: "2020-01", end: null, ongoing: true },
        location: null,
        bullets: ["  Mantuve APIs en TypeScript.  ", "   "],
      },
    ],
    education: [],
    skills: [
      { name: "TypeScript" },
      { name: "typescript" },
      { name: "  " },
    ],
    projects: [],
  };
}

function applicationFailure(run: () => Promise<unknown>): Promise<ApplicationError> {
  return run().then(
    () => {
      throw new Error("Se esperaba un ApplicationError.");
    },
    (error: unknown) => {
      if (error instanceof ApplicationError) {
        return error;
      }
      throw error;
    },
  );
}

describe("importProfileFromPdf", () => {
  it("devuelve un borrador sin contacto y sin llamar al extractor con el email", async () => {
    const pdfTextReader = readerReturning(cvText);
    const profileExtractor = extractorReturning(extractedContent());

    const profile = await importProfileFromPdf({ pdfTextReader, profileExtractor }, new Uint8Array([1, 2, 3]));

    expect(profile.status).toBe("needs_review");
    expect(profile.contact).toEqual({
      name: "",
      email: null,
      phone: null,
      location: null,
      links: [],
    });
    expect(profile.language).toBe("es");
    expect(profile.experiences[0]?.bullets.map((bullet) => bullet.text)).toEqual([
      "Mantuve APIs en TypeScript.",
    ]);
    expect(profile.skills.map((skill) => skill.name)).toEqual(["TypeScript"]);
    expect(profile.skills[0]?.source).toBe("extracted_from_cv");
    expect(profileExtractor.received).toHaveLength(1);
    expect(profileExtractor.received[0]).not.toContain("ada@example.com");
    expect(profileExtractor.received[0]).not.toContain("5555");
    expect(profileExtractor.received[0]).toContain("TypeScript desde 2020");

    expect(() => confirmProfile(profile)).toThrow(DomainError);
  });

  it("rechaza un archivo vacío o demasiado grande sin leerlo", async () => {
    const pdfTextReader = readerReturning(cvText);
    const profileExtractor = extractorReturning(extractedContent());
    const deps = { pdfTextReader, profileExtractor };

    const empty = await applicationFailure(() => importProfileFromPdf(deps, new Uint8Array()));
    expect(empty.code).toBe("empty_pdf");

    const tooLarge = await applicationFailure(() =>
      importProfileFromPdf(deps, new Uint8Array(MAX_PDF_BYTES + 1)),
    );
    expect(tooLarge.code).toBe("pdf_too_large");
    expect(pdfTextReader.calls).toBe(0);
    expect(profileExtractor.received).toHaveLength(0);
  });

  it("rechaza un PDF sin texto seleccionable", async () => {
    const scanned = await applicationFailure(() =>
      importProfileFromPdf(
        {
          pdfTextReader: readerReturning("  \n"),
          profileExtractor: extractorReturning(extractedContent()),
        },
        new Uint8Array([1]),
      ),
    );
    expect(scanned.code).toBe("pdf_without_text");
  });

  it("rechaza un PDF cuyo texto solo era contacto", async () => {
    const profileExtractor = extractorReturning(extractedContent());
    const onlyContact = await applicationFailure(() =>
      importProfileFromPdf(
        {
          pdfTextReader: readerReturning("ada@example.com +54 11 5555 1234"),
          profileExtractor,
        },
        new Uint8Array([1]),
      ),
    );
    expect(onlyContact.code).toBe("pdf_without_text");
    expect(profileExtractor.received).toHaveLength(0);
  });
});
