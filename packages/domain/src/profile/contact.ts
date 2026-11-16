import { z } from "zod";

import { blankToNull, optionalEmail, requiredText } from "../text.ts";

const MAX_PHOTO_BYTES = 1024 * 1024;
const PHOTO_DATA_URI = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export const contactLinkSchema = z.strictObject({
  label: requiredText("La etiqueta del enlace es obligatoria."),
  url: z.string().trim().pipe(z.url("El enlace tiene que ser una URL.")),
});

export type ContactLink = z.infer<typeof contactLinkSchema>;

export const contactPhotoSchema = z
  .string()
  .trim()
  .nullable()
  .superRefine((value, ctx) => {
    if (value === null) {
      return;
    }
    const bytes = photoByteLength(value);
    if (bytes === null) {
      ctx.addIssue({
        code: "custom",
        message: "La foto tiene que ser JPEG, PNG o WebP en data URI.",
      });
      return;
    }
    if (bytes > MAX_PHOTO_BYTES) {
      ctx.addIssue({ code: "custom", message: "La foto supera 1 MiB." });
    }
  });

export const contactSchema = z.strictObject({
  name: z.string().trim(),
  email: optionalEmail,
  phone: blankToNull,
  location: blankToNull,
  links: z.array(contactLinkSchema),
  photo: contactPhotoSchema,
});

function photoByteLength(value: string): number | null {
  const match = PHOTO_DATA_URI.exec(value);
  const payload = match?.[2];
  if (payload === undefined || payload.length === 0 || payload.length % 4 !== 0) {
    return null;
  }
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const bytes = (payload.length * 3) / 4 - padding;
  return bytes > 0 ? bytes : null;
}

export type Contact = z.infer<typeof contactSchema>;
