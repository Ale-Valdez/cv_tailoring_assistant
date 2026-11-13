import { Prisma, PrismaClient } from "./generated/prisma/index.js";

import { createTailoredCvRepository, type TailoredCvRecordStore } from "./tailored-cv-repository.ts";

export function createPrismaTailoredCvRepository(client: PrismaClient = new PrismaClient()): ReturnType<
  typeof createTailoredCvRepository
> {
  return createTailoredCvRepository(createPrismaTailoredCvStore(client));
}

function createPrismaTailoredCvStore(client: PrismaClient): TailoredCvRecordStore {
  return {
    async save(record) {
      const document = record.document as Prisma.InputJsonValue;
      await client.tailoredCvRecord.upsert({
        where: { id: record.id },
        create: {
          id: record.id,
          profileId: record.profileId,
          jobPostingId: record.jobPostingId,
          updatedAt: record.updatedAt,
          document,
        },
        update: {
          profileId: record.profileId,
          jobPostingId: record.jobPostingId,
          updatedAt: record.updatedAt,
          document,
        },
      });
    },
    async findById(id) {
      const row = await client.tailoredCvRecord.findUnique({ where: { id } });
      return row === null ? null : { document: row.document };
    },
    async findByProfileAndJob(profileId, jobPostingId) {
      const row = await client.tailoredCvRecord.findUnique({
        where: { profileId_jobPostingId: { profileId, jobPostingId } },
      });
      return row === null ? null : { document: row.document };
    },
  };
}
