import { describe, expect, it } from "vitest";

import { ApplicationError } from "../errors.ts";
import { confirmReviewedProfile } from "./confirm-reviewed-profile.ts";

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

function thrownBy(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("La operación no falló.");
}

describe("confirmReviewedProfile", () => {
  it("confirma un perfil que ya tiene nombre e idioma", () => {
    const confirmed = confirmReviewedProfile(readyProfile);

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.contact.name).toBe("Ada Lovelace");
    expect(readyProfile.status).toBe("needs_review");
  });

  it("rechaza un perfil sin nombre", () => {
    const error = thrownBy(() =>
      confirmReviewedProfile({
        ...readyProfile,
        contact: { ...readyProfile.contact, name: "" },
      }),
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ code: "profile_not_ready" });
  });

  it("rechaza un cuerpo que no es un perfil", () => {
    const error = thrownBy(() => confirmReviewedProfile({ status: "needs_review" }));

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ code: "invalid_profile" });
  });
});
