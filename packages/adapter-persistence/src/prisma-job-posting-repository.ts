import { Prisma, PrismaClient } from "./generated/prisma/index.js";

import { createJobPostingRepository, type JobPostingRecordStore } from "./job-posting-repository.ts";

export function createPrismaJobPostingRepository(client: PrismaClient = new PrismaClient()): ReturnType<
  typeof createJobPostingRepository
> {
  return createJobPostingRepository(createPrismaJobPostingStore(client));
}

function createPrismaJobPostingStore(client: PrismaClient): JobPostingRecordStore {
  return {
    async save(record) {
      const document = record.document as Prisma.InputJsonValue;
      await client.jobPostingRecord.upsert({
        where: { id: record.id },
        create: {
          id: record.id,
          contentHash: record.contentHash,
          updatedAt: record.updatedAt,
          document,
        },
        update: {
          contentHash: record.contentHash,
          updatedAt: record.updatedAt,
          document,
        },
      });
    },
    async findById(id) {
      const row = await client.jobPostingRecord.findUnique({ where: { id } });
      return row === null ? null : { document: row.document };
    },
    async findByContentHash(contentHash) {
      const row = await client.jobPostingRecord.findUnique({ where: { contentHash } });
      return row === null ? null : { document: row.document };
    },
    async findLatest() {
      const row = await client.jobPostingRecord.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return row === null ? null : { document: row.document };
    },
  };
}
