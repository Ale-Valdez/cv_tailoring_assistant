import type { TailoringProposalInput } from "@cv-tailor/application";

const SYSTEM_PROMPT = [
  "Proponé cambios para acercar el CV a la oferta sin inventar experiencia.",
  "Podés reformular el resumen, reescribir un bullet o reordenar las habilidades que ya están.",
  "El texto queda en el idioma del perfil: no traduzcas, aunque la oferta esté en otro idioma.",
  "No agregues herramientas, empresas, cifras, fechas ni logros que el perfil no respalde.",
  "Si un término de la oferta no aparece en el perfil, no lo uses.",
  "targetType es summary, bullet o skill_order. bulletId lleva el id solo si el objetivo es un bullet; si no, null.",
  "evidence es una lista de type e id. id es null solo cuando type es summary. Usá los ids exactos del perfil.",
  "Un bullet reescrito cita ese bullet. El resumen cita el resumen. El orden cita al menos una habilidad.",
  "El after del orden de habilidades es la lista completa, un nombre por línea, con los mismos nombres del perfil.",
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
