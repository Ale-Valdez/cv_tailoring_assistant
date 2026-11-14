import { apiErrorSchema } from "@cv-tailor/contracts";

const NETWORK = "No hay conexión con el servidor.";
const UNKNOWN = "No se pudo completar la operación.";

export async function readApiError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    return parsed.data.message;
  }
  return UNKNOWN;
}

export function messageFromUnknown(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return NETWORK;
  }
  if (isZodError(error)) {
    return fallback;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

function isZodError(error: unknown): boolean {
  return error instanceof Error && error.name === "ZodError";
}
