import type { TailoringProposalInput } from "@cv-tailor/application";

const SYSTEM_PROMPT = [
  "Proponé cambios para acercar el CV a la oferta sin inventar experiencia.",
  "Podés reformular el resumen, reescribir un bullet, reordenar las habilidades que ya están, o reordenar los bullets de un mismo empleo o de un mismo proyecto.",
  "El texto queda en el idioma del perfil: no traduzcas, aunque la oferta esté en otro idioma.",
  "No agregues herramientas, empresas, cifras, fechas ni logros que el perfil no respalde.",
  "La evidencia citada tiene que sostener el texto nuevo: un bullet reescrito no gana tareas, alcance ni resultados que esa evidencia no tenía.",
  "Un término de la oferta entra en el texto solo si el perfil ya lo usa con ese nombre o con un alias equivalente, como Postgres y PostgreSQL. Una tecnología distinta, aunque sea parecida, no entra.",
  "targetType es summary, bullet, skill_order o bullet_order. bulletId lleva el id solo si el objetivo es un bullet; si no, null.",
  "ownerType es experience o project solo cuando targetType es bullet_order, y ownerId es el id de ese empleo o de ese proyecto. En los otros casos los dos son null.",
  "evidence es una lista de type e id. id es null solo cuando type es summary. Usá los ids exactos del perfil.",
  "Un bullet reescrito cita ese bullet. El resumen cita el resumen. El orden de habilidades cita al menos una habilidad. El orden de bullets cita un bullet de ese empleo o de ese proyecto.",
  "El after del orden de habilidades es la lista completa, un nombre por línea, con los mismos nombres del perfil.",
  "El after del orden de bullets es la lista completa de ese bloque, un texto por línea, con los mismos textos. No reescribas un bullet para reordenarlo y no lo muevas a otro empleo o proyecto.",
  "En ese orden, subí los bullets que hablan de lo que la oferta pide. Si distingue excluyente y deseable, los excluyentes van antes.",
  "Una sola sugerencia de orden de bullets por empleo o por proyecto. Un bloque con un solo bullet no se reordena.",
  "No incluyas datos de contacto.",
  "Si no hay un cambio respaldado, devolvé una lista vacía.",
].join(" ");

export function buildProposeTailoringPrompt(
  input: TailoringProposalInput & { feedback: string | null },
): { system: string; user: string } {
  const requirements = input.job.requirements.map((requirement) => {
    const result = input.match.matchResults.find((item) => item.requirementId === requirement.id);
    return {
      text: requirement.text,
      priority: requirement.priority,
      status: result?.status ?? null,
      note: result?.note ?? null,
      evidenceBulletIds: result?.evidenceBulletIds ?? [],
    };
  });
  const payload = {
    profile: input.profile,
    languageNotice: input.match.languageNotice,
    job: {
      title: input.job.title,
      company: input.job.company,
      language: input.job.language,
      rawText: input.job.rawText,
      requirements,
      keywords: input.match.keywords.map((keyword) => ({
        canonical: keyword.canonical,
        present: keyword.present,
      })),
    },
  };
  const correction =
    input.feedback === null
      ? ""
      : `\n\nEl fabrication guard rechazó estas sugerencias:\n${input.feedback}\nCorregilas o devolvé una lista vacía si no hay una reformulación respaldada. No repitas las que ya eran válidas.`;
  return {
    system: SYSTEM_PROMPT,
    user: `${JSON.stringify(payload)}${correction}`,
  };
}
