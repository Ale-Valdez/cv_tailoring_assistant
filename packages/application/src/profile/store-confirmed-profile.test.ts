import type { ConfirmedProfile } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import type { ProfileRepository } from "../ports/profile-repository.ts";
import { loadConfirmedProfile, storeConfirmedProfile } from "./store-confirmed-profile.ts";

const readyProfile = {
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
};

function memoryProfiles(): ProfileRepository & { saved: ConfirmedProfile[] } {
  const saved: ConfirmedProfile[] = [];
  return {
    saved,
    async save(profile) {
      saved.push(profile);
    },
    async findLatest() {
      return saved.at(-1) ?? null;
    },
  };
}

describe("storeConfirmedProfile", () => {
  it("guarda el perfil confirmado y lo devuelve como el último", async () => {
    const profiles = memoryProfiles();

    const confirmed = await storeConfirmedProfile(profiles, readyProfile);
    const loaded = await loadConfirmedProfile(profiles);

    expect(confirmed.status).toBe("confirmed");
    expect(loaded).toEqual(confirmed);
    expect(profiles.saved).toHaveLength(1);
  });
});
