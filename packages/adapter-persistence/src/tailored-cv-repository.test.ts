import { ApplicationError } from "@cv-tailor/application";
import { confirmProfile, parseProfile, parseTailoredCv, type TailoredCv } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { createTailoredCvRepository, type TailoredCvRecordStore } from "./tailored-cv-repository.ts";

function sampleCv(): TailoredCv {
  const profile = confirmProfile(
    parseProfile({
      id: "11111111-1111-4111-8111-111111111111",
      status: "needs_review",
      contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
      summary: null,
      language: "es",
      experiences: [],
      education: [],
      skills: [],
      projects: [],
    }),
  );
  return parseTailoredCv({
    id: "abababab-abab-4aba-8aba-abababababab",
    profileId: profile.id,
    jobPostingId: "12121212-1212-4121-8121-121212121212",
    status: "draft",
    snapshot: profile,
    suggestions: [],
    matchResults: [],
    exports: [],
  });
}

function memoryStore(): TailoredCvRecordStore & {
  rows: Array<{ id: string; profileId: string; jobPostingId: string; updatedAt: Date; document: unknown }>;
} {
  const rows: Array<{ id: string; profileId: string; jobPostingId: string; updatedAt: Date; document: unknown }> = [];
  return {
    rows,
    async save(record) {
      const index = rows.findIndex((row) => row.id === record.id);
      if (index === -1) {
        rows.push(record);
        return;
      }
      rows[index] = record;
    },
    async findById(id) {
      const row = rows.find((item) => item.id === id);
      return row === undefined ? null : { document: row.document };
    },
    async findByProfileAndJob(profileId, jobPostingId) {
      const row = rows.find((item) => item.profileId === profileId && item.jobPostingId === jobPostingId);
      return row === undefined ? null : { document: row.document };
    },
  };
}

describe("createTailoredCvRepository", () => {
  it("guarda la propuesta y la vuelve a leer por perfil y oferta", async () => {
    const store = memoryStore();
    const repository = createTailoredCvRepository(store);
    const cv = sampleCv();

    await repository.save(cv);

    expect(await repository.findById(cv.id)).toEqual(cv);
    expect(await repository.findByProfileAndJob(cv.profileId, cv.jobPostingId)).toEqual(cv);
    expect(store.rows).toHaveLength(1);
  });

  it("rechaza un documento guardado que no es una propuesta", async () => {
    const cv = sampleCv();
    const store = memoryStore();
    store.rows.push({
      id: cv.id,
      profileId: cv.profileId,
      jobPostingId: cv.jobPostingId,
      updatedAt: new Date(),
      document: { status: "draft" },
    });
    const repository = createTailoredCvRepository(store);

    await expect(repository.findById(cv.id)).rejects.toMatchObject({ code: "invalid_tailored_cv" });
    await expect(repository.findByProfileAndJob(cv.profileId, cv.jobPostingId)).rejects.toBeInstanceOf(ApplicationError);
  });
});
