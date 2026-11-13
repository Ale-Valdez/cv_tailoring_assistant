import { createJobAnalyzer, createProfileExtractor, createTailoringProposer, type ModelConfig } from "@cv-tailor/adapter-ai";
import { createUnpdfTextReader } from "@cv-tailor/adapter-pdf-reader";
import {
  createPrismaJobPostingRepository,
  createPrismaProfileRepository,
  createPrismaTailoredCvRepository,
} from "@cv-tailor/adapter-persistence";
import {
  analyzeJobPosting,
  generateTailoringProposal,
  importProfileFromPdf,
  loadConfirmedProfile,
  loadJobPosting,
  loadLatestJobPosting,
  loadTailoringProposal,
  matchJobPosting,
  reviewSuggestion,
  storeConfirmedProfile,
  type ReviewDecision,
} from "@cv-tailor/application";

export function compose(input: { model: ModelConfig; langsmithTracing: boolean }) {
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
    reviewSuggestion: (tailoredCvId: string, suggestionId: string, decision: ReviewDecision) =>
      reviewSuggestion({ jobPostings: jobs, tailoredCvs }, tailoredCvId, suggestionId, decision),
  };
}

export type AppServices = ReturnType<typeof compose>;
