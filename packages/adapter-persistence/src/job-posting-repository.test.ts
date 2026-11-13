import { ApplicationError } from "@cv-tailor/application";
import { parseJobPosting } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { createJobPostingRepository, type JobPostingRecordStore } from "./job-posting-repository.ts";

const posting = parseJobPosting({
  id: "12121212-1212-4121-8121-121212121212",
  rawText: "Buscamos TypeScript.",
  title: "Backend",
  company: null,
  language: "es",
  contentHash: "hash-uno",
  requirements: [],
  keywords: [],
});

const later = parseJobPosting({
  ...posting,
  id: "13131313-1313-4131-8131-131313131313",
  rawText: "Buscamos PostgreSQL.",
  contentHash: "hash-dos",
});

function memoryStore(): JobPostingRecordStore & {
  rows: Array<{ id: string; contentHash: string; updatedAt: Date; document: unknown }>;
} {
  const rows: Array<{ id: string; contentHash: string; updatedAt: Date; document: unknown }> = [];
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
    async findByContentHash(contentHash) {
      const row = rows.find((item) => item.contentHash === contentHash);
      return row === undefined ? null : { document: row.document };
    },
    async findLatest() {
      let latest: (typeof rows)[number] | null = null;
      for (const row of rows) {
        if (latest === null || row.updatedAt >= latest.updatedAt) {
          latest = row;
        }
      }
      return latest === null ? null : { document: latest.document };
    },
  };
}

describe("createJobPostingRepository", () => {
  it("guarda la oferta y la recupera por id, por hash y como la última", async () => {
    const store = memoryStore();
    const jobs = createJobPostingRepository(store);
    await jobs.save(posting);
    await jobs.save(later);

    expect(await jobs.findById(posting.id)).toEqual(posting);
    expect(await jobs.findByContentHash(later.contentHash)).toEqual(later);
    expect(await jobs.findLatest()).toEqual(later);
    expect(store.rows).toHaveLength(2);
  });

  it("rechaza un documento que el dominio no puede leer", async () => {
    const jobs = createJobPostingRepository({
      ...memoryStore(),
      async findById() {
        return { document: { id: posting.id } };
      },
    });

    await expect(jobs.findById(posting.id)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "invalid_job",
      message: "La oferta guardada no se puede leer.",
    } satisfies Partial<ApplicationError>);
  });
});
