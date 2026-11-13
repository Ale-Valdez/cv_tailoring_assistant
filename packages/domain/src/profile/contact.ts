import { z } from "zod";

import { blankToNull, optionalEmail, requiredText } from "../text.ts";

export const contactLinkSchema = z.strictObject({
  label: requiredText("La etiqueta del enlace es obligatoria."),
  url: z.string().trim().pipe(z.url("El enlace tiene que ser una URL.")),
});

export type ContactLink = z.infer<typeof contactLinkSchema>;

export const contactSchema = z.strictObject({
  name: z.string().trim(),
  email: optionalEmail,
  phone: blankToNull,
  location: blankToNull,
  links: z.array(contactLinkSchema),
});

export type Contact = z.infer<typeof contactSchema>;
