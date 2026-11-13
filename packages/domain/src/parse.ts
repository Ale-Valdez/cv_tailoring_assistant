import { z } from "zod";

import { DomainError } from "./errors.ts";

export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => {
        const path = issue.path.map((part) => String(part)).join(".");
        const where = path.length > 0 ? path : "valor";
        return `${where}: ${issue.message}`;
      })
      .join("; ");
    throw new DomainError("invalid_input", detail.length > 0 ? detail : "El valor no es válido.");
  }
  return result.data;
}
