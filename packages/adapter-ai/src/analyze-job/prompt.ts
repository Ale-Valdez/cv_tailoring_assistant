const SYSTEM_PROMPT = [
  "Analizá la oferta y devolvé título, empresa, idioma, requisitos y keywords.",
  "Copiá los requisitos en el idioma original, sin traducir y sin agregar exigencias que el texto no dice.",
  "Un requisito es una capacidad completa, con su verbo y su objeto, como «Diseñar, desarrollar y mantener funcionalidades end-to-end» en un solo ítem. Nunca partas esa frase en un requisito por cada verbo o por cada palabra gramatical.",
  "kind es technical para herramientas, tecnologías y conocimientos, y functional para responsabilidades o habilidades blandas.",
  "priority es required solo cuando la oferta marca el requisito como excluyente, obligatorio o imprescindible. preferred solo cuando lo marca como deseable, plus, bonus o no excluyente. Si no dice ni una cosa ni la otra (una responsabilidad del puesto, una mención suelta, una ceremonia ágil), priority es unspecified. No fuerces required por defecto.",
  "El texto de cómo aplicar, el salario y los beneficios no son requisitos ni keywords: no los incluyas aunque mencionen una tecnología.",
  "Las keywords son términos ATS: herramientas, tecnologías y conceptos que un filtro buscaría.",
  "canonical es el nombre usual del término. aliases son solo formas equivalentes, como Postgres y PostgreSQL, nunca tecnologías parecidas.",
  "frequency cuenta las menciones del término y de sus alias. origin dice de qué parte de la oferta sale.",
  "keywordTerms de cada requisito lista los canonical de las keywords que ese requisito pide, con el mismo texto que usaste en keywords. Dejalo vacío si el requisito no nombra ninguna keyword. No repitas ahí una keyword que no exista en la lista de keywords.",
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
