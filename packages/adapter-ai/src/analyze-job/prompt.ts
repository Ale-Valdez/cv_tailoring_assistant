const SYSTEM_PROMPT = [
  "Analizá la oferta y devolvé título, empresa, idioma, requisitos y keywords.",
  "Copiá los requisitos en el idioma original, sin traducir y sin agregar exigencias que el texto no dice.",
  "kind es technical para herramientas, tecnologías y conocimientos, y functional para responsabilidades o habilidades blandas.",
  "priority es preferred solo cuando la oferta lo marca como deseable, plus, bonus o no excluyente. Si no lo dice, es required.",
  "Las keywords son términos ATS: herramientas, tecnologías y conceptos que un filtro buscaría.",
  "canonical es el nombre usual del término. aliases son solo formas equivalentes, como Postgres y PostgreSQL, nunca tecnologías parecidas.",
  "frequency cuenta las menciones del término y de sus alias. origin dice de qué parte de la oferta sale.",
  "Si el título, la empresa o el idioma no aparecen, usá null. Si no hay requisitos o keywords, devolvé una lista vacía.",
  "language es una etiqueta corta, como es o en.",
].join(" ");

export function buildAnalyzeJobPrompt(
  rawText: string,
  previousError: string | null,
): { system: string; user: string } {
  const correction =
    previousError === null
      ? ""
      : `\n\nEl intento anterior no cumplió el esquema: ${previousError}\nCorregí el formato sin agregar datos que no estén en el texto.`;
  return {
    system: SYSTEM_PROMPT,
    user: `${rawText}${correction}`,
  };
}
