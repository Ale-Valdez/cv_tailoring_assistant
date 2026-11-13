import { z } from "zod";

export const blankToNull = z.union([z.string(), z.null()]).transform((value) => {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
});

export const optionalEmail = blankToNull.pipe(z.email("El email no es válido.").nullable());

export const optionalUrl = blankToNull.pipe(z.url("La URL no es válida.").nullable());

export function requiredText(message: string) {
  return z.string().trim().min(1, message);
}
