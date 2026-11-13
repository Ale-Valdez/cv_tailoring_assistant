import {
  createExportId,
  DomainError,
  exportIdSchema,
  parseTailoredCv,
  profileForRender,
  type TailoredCv,
} from "@cv-tailor/domain";

import { ApplicationError } from "../errors.ts";
import type { CvHtmlRenderer } from "../ports/cv-html-renderer.ts";
import type { FileStorage } from "../ports/file-storage.ts";
import type { PdfGenerator } from "../ports/pdf-generator.ts";
import { loadTailoringProposal, type GenerateTailoringProposalDeps } from "./generate-tailoring-proposal.ts";

const PROPOSAL_NOT_FOUND = "Todavía no hay una propuesta para esta oferta.";
const EXPORT_NOT_FOUND = "No hay un PDF con esa versión.";
const NOT_READY = "Quedan sugerencias sin revisar.";
const NOT_FINAL = "La propuesta todavía no está lista para exportar.";

export interface ExportTailoredCvDeps extends Pick<GenerateTailoringProposalDeps, "profiles" | "tailoredCvs"> {
  htmlRenderer: CvHtmlRenderer;
  pdfGenerator: PdfGenerator;
  files: FileStorage;
  now?: () => string;
}

export interface TailoredCvPdf {
  bytes: Uint8Array;
  filename: string;
}

export async function exportTailoredCv(deps: ExportTailoredCvDeps, jobPostingId: string): Promise<TailoredCv> {
  const cv = await loadTailoringProposal(deps, jobPostingId);
  if (cv === null) {
    throw new ApplicationError("proposal_not_found", PROPOSAL_NOT_FOUND);
  }
  if (cv.suggestions.some((suggestion) => suggestion.status === "pending")) {
    throw new ApplicationError("export_not_ready", NOT_READY);
  }
  if (cv.status !== "final") {
    throw new ApplicationError("export_not_ready", NOT_FINAL);
  }

  let html: string;
  try {
    html = deps.htmlRenderer.render(profileForRender(cv));
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", error.message, error);
    }
    throw error;
  }

  const version = cv.exports.reduce((max, item) => Math.max(max, item.version), 0) + 1;
  const createdAt = (deps.now ?? (() => new Date().toISOString()))();
  const stored = {
    id: createExportId(),
    createdAt,
    version,
    storageKey: `exports/${cv.id}/${version}.pdf`,
  };
  let updated: TailoredCv;
  try {
    updated = parseTailoredCv({ ...cv, exports: [...cv.exports, stored] });
  } catch (error) {
    if (error instanceof DomainError) {
      throw new ApplicationError("invalid_tailored_cv", error.message, error);
    }
    throw error;
  }
  const pdf = await deps.pdfGenerator.generate(html);
  await deps.files.put(stored.storageKey, pdf);
  await deps.tailoredCvs.save(updated);
  return updated;
}

export async function loadTailoredCvExport(
  deps: Pick<ExportTailoredCvDeps, "profiles" | "tailoredCvs" | "files">,
  jobPostingId: string,
  exportId: string,
): Promise<TailoredCvPdf> {
  const cv = await loadTailoringProposal(deps, jobPostingId);
  if (cv === null) {
    throw new ApplicationError("proposal_not_found", PROPOSAL_NOT_FOUND);
  }
  const parsedId = exportIdSchema.safeParse(exportId);
  const stored = parsedId.success ? cv.exports.find((item) => item.id === parsedId.data) : undefined;
  if (stored === undefined) {
    throw new ApplicationError("export_not_found", EXPORT_NOT_FOUND);
  }
  const bytes = await deps.files.get(stored.storageKey);
  if (bytes === null) {
    throw new ApplicationError("export_not_found", EXPORT_NOT_FOUND);
  }
  return { bytes, filename: pdfFilename(cv.snapshot.contact.name, stored.version) };
}

function pdfFilename(name: string, version: number): string {
  const clean = name.replace(/[\r\n"/\\]/g, " ").replace(/\s+/g, " ").trim();
  const base = clean.length > 0 ? clean : "cv";
  return `${base}-v${version}.pdf`;
}
