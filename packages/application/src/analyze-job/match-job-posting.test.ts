import { confirmProfile, parseProfile, type ConfirmedProfile, type JobPosting, type JobPostingId } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import type { JobPostingRepository } from "../ports/job-posting-repository.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";
import { loadJobPosting, matchJobPosting } from "./match-job-posting.ts";

const jobId = "12121212-1212-4121-8121-121212121212";

function confirmedProfile(): ConfirmedProfile {
  return confirmProfile(
    parseProfile({
      id: "11111111-1111-4111-8111-111111111111",
      status: "needs_review",
      contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
      summary: null,
      language: "es",
      experiences: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [{ id: "33333333-3333-4333-8333-333333333333", text: "Mantuve APIs en TypeScript." }],
        },
      ],
      education: [],
      skills: [],
      projects: [],
    }),
  );
}

function posting(): JobPosting {
  return {
    id: jobId as JobPosting["id"],
    rawText: "Buscamos TypeScript.",
    title: "Backend",
    company: null,
    language: "es",
    contentHash: "abc",
    requirements: [
      {
        id: "13131313-1313-4131-8131-131313131313" as JobPosting["requirements"][number]["id"],
        text: "Experiencia con TypeScript",
        kind: "technical",
        priority: "required",
      },
    ],
    keywords: [
      {
        id: "14141414-1414-4141-8141-141414141414" as JobPosting["keywords"][number]["id"],
        canonical: "TypeScript",
        aliases: [],
        frequency: 1,
        origin: "requisitos",
      },
    ],
  };
}

function profilesWith(profile: ConfirmedProfile | null): ProfileRepository {
  return {
    async save() {},
    async findLatest() {
      return profile;
    },
  };
}

function jobsWith(stored: JobPosting | null): JobPostingRepository {
  return {
    async save() {},
    async findById(id: JobPostingId) {
      return stored !== null && stored.id === id ? stored : null;
    },
    async findByContentHash() {
      return null;
    },
    async findLatest() {
      return stored;
    },
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

describe("matchJobPosting", () => {
  it("compara la oferta guardada con el perfil confirmado", async () => {
    const report = await matchJobPosting(
      { profiles: profilesWith(confirmedProfile()), jobPostings: jobsWith(posting()) },
      jobId,
    );

    expect(report.matchResults[0]?.status).toBe("covered");
    expect(report.languageNotice).toBeNull();
  });

  it("falla si no hay perfil o la oferta no existe", async () => {
    const missingProfile = await applicationFailure(() =>
      matchJobPosting({ profiles: profilesWith(null), jobPostings: jobsWith(posting()) }, jobId),
    );
    const missingJob = await applicationFailure(() =>
      matchJobPosting({ profiles: profilesWith(confirmedProfile()), jobPostings: jobsWith(null) }, jobId),
    );
    const invalidId = await applicationFailure(() => loadJobPosting(jobsWith(posting()), "no-es-un-id"));

    expect(missingProfile.code).toBe("profile_not_found");
    expect(missingJob.code).toBe("job_not_found");
    expect(invalidId.code).toBe("job_not_found");
  });
});
