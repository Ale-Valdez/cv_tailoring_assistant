import { z } from "zod";

import { exportIdSchema } from "../ids.ts";
import { parseSchema } from "../parse.ts";
import { requiredText } from "../text.ts";

export const cvExportSchema = z.strictObject({
  id: exportIdSchema,
  createdAt: z.iso.datetime(),
  version: z.int().min(1, "La versión del PDF empieza en 1."),
  storageKey: requiredText("La exportación necesita una clave de almacenamiento."),
});

export type CvExport = z.infer<typeof cvExportSchema>;

export function parseCvExport(value: unknown): CvExport {
  return parseSchema(cvExportSchema, value);
}
