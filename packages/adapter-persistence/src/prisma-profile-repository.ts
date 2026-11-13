import { Prisma, PrismaClient } from "./generated/prisma/index.js";

import { createProfileRepository, type ProfileRecordStore } from "./profile-repository.ts";

export function createPrismaProfileRepository(client: PrismaClient = new PrismaClient()): ReturnType<
  typeof createProfileRepository
> {
  return createProfileRepository(createPrismaProfileStore(client));
}

function createPrismaProfileStore(client: PrismaClient): ProfileRecordStore {
  return {
    async save(record) {
      const document = record.document as Prisma.InputJsonValue;
      await client.profileRecord.upsert({
        where: { id: record.id },
        create: { id: record.id, updatedAt: record.updatedAt, document },
        update: { updatedAt: record.updatedAt, document },
      });
    },
    async findLatest() {
      const row = await client.profileRecord.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      if (row === null) {
        return null;
      }
      return { document: row.document };
    },
  };
}
