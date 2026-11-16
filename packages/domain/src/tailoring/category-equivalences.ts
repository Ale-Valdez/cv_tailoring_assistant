// Tabla corta de la Fase 4 (docs/07-plan-auditoria-matching.md).
// Una fila dice que un bullet con esa evidencia respalda la categoría del
// requisito solo en parte. No es un alias: no produce `covered` y no cubre
// otro producto de la misma familia. Lo que no está en esta tabla no se infiere.

export interface CategoryEquivalence {
  label: string;
  requirementPhrases: readonly string[];
  evidencePhrases: readonly string[];
}

export const CATEGORY_EQUIVALENCES: readonly CategoryEquivalence[] = [
  {
    label: "base de datos vectorial",
    requirementPhrases: [
      "base de datos vectorial",
      "bases de datos vectoriales",
      "vector database",
      "vector databases",
    ],
    evidencePhrases: ["Qdrant"],
  },
  {
    label: "procesamiento asíncrono",
    requirementPhrases: ["procesamiento asíncrono"],
    evidencePhrases: ["colas de Redis", "cola de Redis", "Celery"],
  },
];
