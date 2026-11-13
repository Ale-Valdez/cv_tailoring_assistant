import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createFileStorage } from "./file-storage.ts";

describe("createFileStorage", () => {
  it("guarda y lee bytes dentro del directorio", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "cv-files-"));
    const storage = createFileStorage(root);
    const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46]);

    await storage.put("exports/cv/1.pdf", bytes);

    expect(await storage.get("exports/cv/1.pdf")).toEqual(bytes);
    expect(await readFile(path.join(root, "exports/cv/1.pdf"))).toEqual(Buffer.from(bytes));
    expect(await storage.get("exports/cv/2.pdf")).toBeNull();
  });

  it("rechaza una clave que sale del directorio", async () => {
    const storage = createFileStorage(await mkdtemp(path.join(tmpdir(), "cv-files-")));

    await expect(storage.put("../secreto.pdf", Uint8Array.from([1]))).rejects.toMatchObject({
      code: "invalid_storage_key",
    });
    await expect(storage.get("/etc/passwd")).rejects.toMatchObject({ code: "invalid_storage_key" });
  });
});