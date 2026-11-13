import {
  confirmProfile,
  parseProfile,
  parseTailoredCv,
  type ConfirmedProfile,
  type TailoredCv,
} from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import type { CvHtmlRenderer } from "../ports/cv-html-renderer.ts";
import type { FileStorage } from "../ports/file-storage.ts";
import type { PdfGenerator } from "../ports/pdf-generator.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";
import type { TailoredCvRepository } from "../ports/tailored-cv-repository.ts";
import { exportTailoredCv, loadTailoredCvExport } from "./export-tailored-cv.ts";

const profileId = "11111111-1111-4111-8111-111111111111";
const jobId = "12121212-1212-4121-8121-121212121212";
const bulletId = "33333333-3333-4333-8333-333333333333";
const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tailoredCvId = "abababab-abab-4aba-8aba-abababababab";
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

function profile(): ConfirmedProfile {
  return confirmProfile(
    parseProfile({
      id: profileId,
      status: "needs_review",
      contact: { name: "Ada Lovelace", email: null, phone: null, location: null, links: [] },
      summary: "Desarrolla servicios con TypeScript.",
      language: "es",
      experiences: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          organization: "Analytical Engines",
          role: "Desarrolladora",
          span: { start: "2020-01", end: null, ongoing: true },
          location: null,
          bullets: [{ id: bulletId, text: "Mantuve APIs en TypeScript." }],
        },
      ],
      education: [],
      skills: [],
      projects: [],
    }),
  );
}

function cv(status: "pending" | "accepted" | "rejected" | "draft"): TailoredCv {
  const suggestions =
    status === "draft"
      ? []
      : [
          {
            id: suggestionId,
            target: { type: "bullet" as const, bulletId },
            before: "Mantuve APIs en TypeScript.",
            after: "Mantuve APIs en TypeScript para el servicio.",
            reason: "Aclara el alcance.",
            evidence: [{ type: "bullet" as const, bulletId }],
            status,
            validation: { outcome: "valid" as const },
          },
        ];
  return parseTailoredCv({
    id: tailoredCvId,
    profileId,
    jobPostingId: jobId,
    status: status === "pending" ? "in_review" : status === "draft" ? "draft" : "final",
    snapshot: profile(),
    suggestions,
    matchResults: [],
    exports: [],
  });
}

function harness(initial: TailoredCv | null) {
  let current = initial;
  const rendered: string[] = [];
  let pdfCalls = 0;
  const files = new Map<string, Uint8Array>();
  const profiles: ProfileRepository = {
    save: async () => undefined,
    findLatest: async () => profile(),
  };
  const tailoredCvs: TailoredCvRepository = {
    save: async (next) => {
      current = next;
    },
    findById: async () => current,
    findByProfileAndJob: async () => current,
  };
  const htmlRenderer: CvHtmlRenderer = {
    render(value) {
      rendered.push(value.experiences[0]?.bullets[0]?.text ?? "");
      return "<html>Ada</html>";
    },
  };
  const pdfGenerator: PdfGenerator = {
    async generate() {
      pdfCalls += 1;
      return pdf;
    },
  };
  const storage: FileStorage = {
    async put(key, bytes) {
      files.set(key, bytes);
    },
    async get(key) {
      return files.get(key) ?? null;
    },
  };
  const deps = {
    profiles,
    tailoredCvs,
    htmlRenderer,
    pdfGenerator,
    files: storage,
    now: () => "2026-11-13T20:00:00.000Z",
  };
  return { deps, rendered, files, pdfCalls: () => pdfCalls, current: () => current };
}

describe("exportTailoredCv", () => {
  it("guarda la versión 1 con el texto aceptado y permite descargarla", async () => {
    const box = harness(cv("accepted"));

    const exported = await exportTailoredCv(box.deps, jobId);
    const file = await loadTailoredCvExport(box.deps, jobId, exported.exports[0]?.id ?? "");

    expect(exported.exports).toHaveLength(1);
    expect(exported.exports[0]).toMatchObject({
      version: 1,
      createdAt: "2026-11-13T20:00:00.000Z",
      storageKey: `exports/${tailoredCvId}/1.pdf`,
    });
    expect(box.rendered).toEqual(["Mantuve APIs en TypeScript para el servicio."]);
    expect(file.filename).toBe("Ada Lovelace-v1.pdf");
    expect(file.bytes).toEqual(pdf);
  });

  it("suma una versión nueva y deja la anterior", async () => {
    const box = harness(cv("accepted"));

    const first = await exportTailoredCv(box.deps, jobId);
    const second = await exportTailoredCv(box.deps, jobId);

    expect(second.exports.map((item) => item.version)).toEqual([1, 2]);
    expect(box.files.size).toBe(2);
    const again = await loadTailoredCvExport(box.deps, jobId, first.exports[0]?.id ?? "");
    expect(again.filename).toBe("Ada Lovelace-v1.pdf");
  });

  it("exporta un rechazo con el texto original y no llama al renderer si queda algo pendiente", async () => {
    const rejected = harness(cv("rejected"));
    await exportTailoredCv(rejected.deps, jobId);
    expect(rejected.rendered).toEqual(["Mantuve APIs en TypeScript."]);

    const pending = harness(cv("pending"));
    await expect(exportTailoredCv(pending.deps, jobId)).rejects.toMatchObject({ code: "export_not_ready" });
    expect(pending.pdfCalls()).toBe(0);
    expect(pending.files.size).toBe(0);
  });

  it("no exporta un borrador sin sugerencias ni una versión que no existe", async () => {
    const box = harness(cv("draft"));
    await expect(exportTailoredCv(box.deps, jobId)).rejects.toMatchObject({
      code: "export_not_ready",
      message: "La propuesta todavía no está lista para exportar.",
    });

    const ready = harness(cv("accepted"));
    await expect(loadTailoredCvExport(ready.deps, jobId, "cccccccc-cccc-4ccc-8ccc-cccccccccccc")).rejects.toMatchObject({
      code: "export_not_found",
    });
  });
});
