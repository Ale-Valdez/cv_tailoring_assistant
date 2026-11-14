import {
  analyzeJobPosting,
  generateTailoringProposal,
  importProfileFromPdf,
  storeConfirmedProfile,
  type JobPostingRepository,
  type ProfileRepository,
  type TailoredCvRepository,
} from "@cv-tailor/application";
import { describe, expect, it } from "vitest";

import {
  createFixtureJobAnalyzer,
  createFixtureProfileExtractor,
  createFixtureTailoringProposer,
  FIXTURE_JOB_TITLE,
  FIXTURE_REWRITE,
} from "./fixture-adapters.ts";

describe("respuestas fijas del recorrido e2e", () => {
  it("arma una sugerencia válida sin llamar al modelo", async () => {
    const profiles = memoryProfiles();
    const jobs = memoryJobs();
    const tailoredCvs = memoryCvs();

    const imported = await importProfileFromPdf(
      {
        pdfTextReader: {
          async readText() {
            return "CV de prueba con TypeScript.";
          },
        },
        profileExtractor: createFixtureProfileExtractor(),
      },
      new Uint8Array([1]),
    );
    await storeConfirmedProfile(profiles, {
      ...imported,
      contact: { ...imported.contact, name: "Ada Lovelace" },
    });

    const job = await analyzeJobPosting(
      { jobAnalyzer: createFixtureJobAnalyzer(), jobPostings: jobs },
      "Buscamos experiencia con TypeScript.",
    );
    const proposal = await generateTailoringProposal(
      { profiles, jobPostings: jobs, tailoredCvs, proposer: createFixtureTailoringProposer() },
      job.id,
    );

    expect(job.title).toBe(FIXTURE_JOB_TITLE);
    expect(proposal.suggestions).toHaveLength(1);
    expect(proposal.suggestions[0]?.after).toBe(FIXTURE_REWRITE);
    expect(proposal.suggestions[0]?.validation).toEqual({ outcome: "valid" });
  });
});

function memoryProfiles(): ProfileRepository {
  let current: Awaited<ReturnType<ProfileRepository["findLatest"]>> = null;
  return {
    async save(profile) {
      current = profile;
    },
    async findLatest() {
      return current;
    },
  };
}

function memoryJobs(): JobPostingRepository {
  const rows: Parameters<JobPostingRepository["save"]>[0][] = [];
  return {
    async save(posting) {
      const index = rows.findIndex((row) => row.id === posting.id);
      if (index === -1) {
        rows.push(posting);
        return;
      }
      rows[index] = posting;
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByContentHash(contentHash) {
      return rows.find((row) => row.contentHash === contentHash) ?? null;
    },
    async findLatest() {
      return rows.at(-1) ?? null;
    },
  };
}

function memoryCvs(): TailoredCvRepository {
  const rows: Parameters<TailoredCvRepository["save"]>[0][] = [];
  return {
    async save(cv) {
      const index = rows.findIndex((row) => row.id === cv.id);
      if (index === -1) {
        rows.push(cv);
        return;
      }
      rows[index] = cv;
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByProfileAndJob(profileId, jobPostingId) {
      return rows.find((row) => row.profileId === profileId && row.jobPostingId === jobPostingId) ?? null;
    },
  };
}
