# ADR-027: Prioridad `unspecified`, nota de brecha sin cambiar el esquema, y keywords explícitas por requisito

- Estado: Aceptada (resuelve D27)
- Fecha: 2026-11-16

## Contexto

La Fase 3 del [plan de auditoría de matching](../07-plan-auditoria-matching.md) dejaba tres decisiones pendientes:

1. `Requirement.priority` solo distinguía `required` y `preferred`. Lo que la oferta no marca como excluyente ni como deseable (una responsabilidad del puesto, una mención suelta, una ceremonia ágil) caía en `required` por defecto, lo que infla esa categoría y no refleja lo que la oferta realmente exige.
2. La nota de un `gap` ya distingue "sin evidencia en el perfil" de "la habilidad está declarada, sin un bullet que la respalde", pero faltaba decidir si una brecha más detallada (por ejemplo, "hay una tecnología de la misma categoría") se expresa como texto de la nota o como un estado nuevo de `MatchResult`.
3. La relación entre un requisito y las keywords que lo sustentan se calculaba al vuelo, comparando el texto del requisito contra cada keyword (`signalsFor` en `match-profile.ts`). No quedaba guardada, así que no se podía auditar ni citar directamente.

## Decisión

1. **Prioridad.** `requirementPrioritySchema` suma `"unspecified"`. El prompt de `analyze-job` pide `required` solo si la oferta marca el requisito como excluyente u obligatorio, `preferred` solo si lo marca como deseable, plus, bonus o no excluyente, y `unspecified` en cualquier otro caso, sin forzar `required` por defecto. Es un cambio de enum, no de forma: un documento guardado antes de esta fase ya tiene `required` o `preferred`, valores que siguen siendo válidos, así que no hace falta normalizar nada al leer. Una oferta ya analizada solo recibe `unspecified` si se vuelve a analizar (el caché por `contentHash` no se invalida retroactivamente).
2. **Detalle de la brecha.** Se mantiene `MatchStatus` en `covered` | `partial` | `gap`, sin partirlo. El detalle de una brecha (concepto ausente, habilidad sin bullet, o más adelante una tecnología de la misma categoría) se expresa como texto de `MatchResult.note`, no como un estado nuevo. La Fase 4 (equivalencias de categoría) va a enriquecer esa nota con el mismo mecanismo, no va a tocar el esquema.
3. **Keywords de cada requisito.** `Requirement` suma `keywordIds: KeywordId[]`, una referencia explícita a `JobPosting.keywords`. `analyzeJobGraph` pide al modelo `keywordTerms` por requisito (los `canonical` de las keywords que ese requisito pide), y `analyzeJobPosting` los resuelve a `KeywordId` después de deduplicar las keywords (`normalizeKeywordDrafts`), así que un alias de diccionario (`Postgres`) resuelve a la keyword final (`PostgreSQL`) aunque el modelo no haya usado ese nombre exacto. Un término que no está en `keywords` se descarta: no se inventa una keyword nueva solo porque la citó un requisito. `matchProfileToJob` usa `keywordIds` como señal adicional en `signalsFor`, sumada (no en lugar) al cálculo por texto existente: un requisito guardado antes de esta fase, con `keywordIds` vacío, sigue dependiendo solo del texto. Un documento viejo se normaliza a `keywordIds: []` al leer (`jobPostingSchema`), sin migración SQL. `jobPostingSchema` rechaza un requisito que repite una keyword o que cita una que no está en `posting.keywords`.

## Consecuencias

- `ExtractedRequirement` (puerto `JobAnalyzer`) suma `priority: "unspecified"` y `keywordTerms?: readonly string[]`, opcional para que un analizador que no lo provee siga compilando.
- La pantalla de la oferta (`apps/web/app/job-flow.tsx`) agrega la etiqueta "Sin especificar" para `unspecified`. El recuento de cobertura sigue contando por `MatchStatus`, no por prioridad, así que no cambia.
- `checkFabrication` y el resto del dominio no leen `priority` ni `keywordIds`: esta fase no cambia la generación de sugerencias.
- Pendiente: la Fase 4 (equivalencias de categoría) va a apoyarse en `keywordIds` y en el mecanismo de nota enriquecida que confirma esta decisión.
