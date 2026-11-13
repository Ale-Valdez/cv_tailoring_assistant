import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ApplicationError, type FileStorage } from "@cv-tailor/application";

export function createFileStorage(root: string): FileStorage {
  const directory = path.resolve(root);
  return {
    async put(key: string, bytes: Uint8Array): Promise<void> {
      const target = resolveStoredPath(directory, key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes);
    },
    async get(key: string): Promise<Uint8Array | null> {
      const target = resolveStoredPath(directory, key);
      try {
        return new Uint8Array(await readFile(target));
      } catch (error) {
        if (isNotFound(error)) {
          return null;
        }
        throw error;
      }
    },
  };
}

function resolveStoredPath(root: string, key: string): string {
  if (key.length === 0 || key.includes("\0") || path.isAbsolute(key) || key.split(/[\\/]/).includes("..")) {
    throw new ApplicationError("invalid_storage_key", "La clave de almacenamiento no es válida.");
  }
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new ApplicationError("invalid_storage_key", "La clave de almacenamiento no es válida.");
  }
  return target;
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
