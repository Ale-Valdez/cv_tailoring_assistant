import { createJobAnalyzer, createProfileExtractor, createTailoringProposer, type ModelConfig } from "@cv-tailor/adapter-ai";
import { createCvHtmlRenderer } from "@cv-tailor/adapter-cv-template";
import { createPdfGenerator } from "@cv-tailor/adapter-pdf-renderer";
import { createUnpdfTextReader } from "@cv-tailor/adapter-pdf-reader";
import {
  createFileStorage,
  createPrismaJobPostingRepository,
  createPrismaProfileRepository,
  createPrismaTailoredCvRepository,
} from "@cv-tailor/adapter-persistence";
import {
  analyzeJobPosting,
  exportTailoredCv,
  generateTailoringProposal,
  importProfileFromPdf,
  loadConfirmedProfile,
  loadJobPosting,
  loadLatestJobPosting,
  loadTailoredCvExport,
  loadTailoringProposal,
  matchJobPosting,
  previewTailoredCv,
  reviewSuggestion,
  storeConfirmedProfile,
  type ReviewDecision,
} from "@cv-tailor/application";

export function compose(input: {
  model: ModelConfig;
  langsmithTracing: boolean;
  filesDir: string;
  rendererUrl: string;
}) {
  const profiles = createPrismaProfileRepository();
  const jobs = createPrismaJobPostingRepository();
  const importDeps = {
    pdfTextReader: createUnpdfTextReader(),
    profileExtractor: createProfileExtractor(input.model),
  };
  const analyzeDeps = {
    jobAnalyzer: createJobAnalyzer(input.model),
    jobPostings: jobs,
  };
  const tailoredCvs = createPrismaTailoredCvRepository();
  const exportDeps = {
    profiles,
    tailoredCvs,
    htmlRenderer: createCvHtmlRenderer(),
    pdfGenerator: createPdfGenerator({ baseUrl: input.rendererUrl }),
    files: createFileStorage(input.filesDir),
  };
  const proposalDeps = {
    profiles,
    jobPostings: jobs,
    tailoredCvs,
    proposer: createTailoringProposer(input.model),
  };
  return {
    langsmithTracing: input.langsmithTracing,
    importProfileFromPdf: (pdf: Uint8Array) => importProfileFromPdf(importDeps, pdf),
    storeConfirmedProfile: (value: unknown) => storeConfirmedProfile(profiles, value),
    loadConfirmedProfile: () => loadConfirmedProfile(profiles),
    analyzeJobPosting: (text: string) => analyzeJobPosting(analyzeDeps, text),
    loadLatestJobPosting: () => loadLatestJobPosting(jobs),
    loadJobPosting: (id: string) => loadJobPosting(jobs, id),
    matchJobPosting: (id: string) => matchJobPosting({ profiles, jobPostings: jobs }, id),
    generateTailoringProposal: (id: string) => generateTailoringProposal(proposalDeps, id),
    loadTailoringProposal: (id: string) => loadTailoringProposal(proposalDeps, id),
    previewTailoredCv: (id: string) =>
      previewTailoredCv({ ...proposalDeps, htmlRenderer: createCvHtmlRenderer() }, id),
    exportTailoredCv: (id: string) => exportTailoredCv(exportDeps, id),
    loadTailoredCvExport: (id: string, exportId: string) => loadTailoredCvExport(exportDeps, id, exportId),
    reviewSuggestion: (tailoredCvId: string, suggestionId: string, decision: ReviewDecision) =>
      reviewSuggestion({ jobPostings: jobs, tailoredCvs }, tailoredCvId, suggestionId, decision),
  };
}

export type AppServices = ReturnType<typeof compose>;
