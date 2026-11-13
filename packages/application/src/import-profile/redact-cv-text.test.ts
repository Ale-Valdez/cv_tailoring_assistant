import { describe, expect, it } from "vitest";

import { redactContactFromCvText } from "./redact-cv-text.ts";

describe("redactContactFromCvText", () => {
  it("quita emails y teléfonos y conserva el resto del CV", () => {
    const text = [
      "Ada Lovelace ada@example.com",
      "Tel +54 11 5555 1234 y también +541155551234",
      "Experiencia en TypeScript desde 2020.",
      "Proyecto https://github.com/ada/motor",
    ].join("\n");

    const redacted = redactContactFromCvText(text);

    expect(redacted).not.toContain("ada@example.com");
    expect(redacted).not.toContain("+54");
    expect(redacted).not.toContain("5555");
    expect(redacted).toContain("Experiencia en TypeScript desde 2020.");
    expect(redacted).toContain("https://github.com/ada/motor");
  });
});
