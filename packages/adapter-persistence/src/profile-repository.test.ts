import { ApplicationError } from "@cv-tailor/application";
import { confirmProfile, parseProfile } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { createProfileRepository, type ProfileRecordStore } from "./profile-repository.ts";

const confirmed = confirmProfile(
  parseProfile({
    id: "11111111-1111-4111-8111-111111111111",
    status: "needs_review",
    contact: {
      name: "Ada Lovelace",
      email: null,
      phone: null,
      location: null,
      links: [],
    },
    summary: null,
    language: "es",
    experiences: [],
    education: [],
    skills: [],
    projects: [],
  }),
);

function memoryStore(): ProfileRecordStore & { rows: Array<{ id: string; updatedAt: Date; document: unknown }> } {
  const rows: Array<{ id: string; updatedAt: Date; document: unknown }> = [];
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
    async findLatest() {
      let latest: (typeof rows)[number] | null = null;
      for (const row of rows) {
        if (latest === null || row.updatedAt >= latest.updatedAt) {
          latest = row;
        }
      }
      return latest;
    },
  };
}

describe("createProfileRepository", () => {
  it("guarda el perfil y vuelve a leer el último", async () => {
    const store = memoryStore();
    const profiles = createProfileRepository(store);
    await profiles.save(confirmed);

    const loaded = await profiles.findLatest();

    expect(loaded).toEqual(confirmed);
    expect(store.rows).toHaveLength(1);
  });

  it("rechaza un documento guardado que no es un perfil", async () => {
    const store = memoryStore();
    store.rows.push({ id: "roto", updatedAt: new Date(), document: { status: "confirmed" } });
    const profiles = createProfileRepository(store);

    await expect(profiles.findLatest()).rejects.toBeInstanceOf(ApplicationError);
    await expect(profiles.findLatest()).rejects.toMatchObject({ code: "invalid_profile" });
  });
});
