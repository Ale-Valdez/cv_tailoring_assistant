const SYSTEM_PROMPT = [
  "Estructurá el CV en los campos del esquema.",
  "Copiá solo lo que está en el texto, en su idioma original, sin traducir.",
  "Si un dato no aparece, dejá el texto vacío o null y la lista vacía.",
  "No inventes empresas, cargos, fechas, estudios, proyectos ni habilidades.",
  "Cada bullet queda dentro del empleo o del proyecto donde aparece en el texto. No fusiones frases de empleos o proyectos distintos en un solo bullet, aunque hablen de la misma tecnología.",
  "Una habilidad que el texto solo nombra en la lista de habilidades no se convierte en una experiencia, en un proyecto ni en un bullet nuevo: va únicamente en skills.",
  "No incluyas nombre, email, teléfono, ubicación personal ni enlaces de contacto: no forman parte del resultado.",
  "Las fechas son AAAA-MM o null.",
  "ongoing es true solo si el texto dice que el período sigue abierto, y en ese caso end es null.",
  "language es una etiqueta corta del idioma del texto, como es o en.",
].join(" ");

export function buildExtractProfilePrompt(
  cvText: string,
  previousError: string | null,
): { system: string; user: string } {
  const correction =
    previousError === null
      ? ""
      : `\n\nEl intento anterior no cumplió el esquema: ${previousError}\nCorregí el formato sin agregar datos que no estén en el texto.`;
  return {
    system: SYSTEM_PROMPT,
    user: `${cvText}${correction}`,
  };
}
