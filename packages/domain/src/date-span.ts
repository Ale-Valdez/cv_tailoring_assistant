import { z } from "zod";

export const yearMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Usa el formato AAAA-MM.");

export const dateSpanSchema = z
  .strictObject({
    start: yearMonthSchema.nullable(),
    end: yearMonthSchema.nullable(),
    ongoing: z.boolean(),
  })
  .superRefine((span, ctx) => {
    if (span.ongoing && span.end !== null) {
      ctx.addIssue({
        code: "custom",
        message: "Un período en curso no tiene fecha de fin.",
        path: ["end"],
      });
    }
    if (span.start !== null && span.end !== null && span.end < span.start) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de fin es anterior a la de inicio.",
        path: ["end"],
      });
    }
  });

export type DateSpan = z.infer<typeof dateSpanSchema>;
