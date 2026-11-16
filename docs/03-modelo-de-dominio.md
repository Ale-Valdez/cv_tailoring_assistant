# 03 - Modelo de dominio

Todas las entidades viven en el paquete `domain` (no son modelos de Prisma). El adaptador de persistencia las mapea a tablas.

```mermaid
erDiagram
  Profile ||--o{ Experience : has
  Profile ||--o{ Education : has
  Profile ||--o{ SkillEntry : has
  Profile ||--o{ Project : has
  Experience ||--o{ Bullet : has
  Project ||--o{ Bullet : has
  Profile ||--o{ TailoredCV : source_of
  JobPosting ||--o{ Requirement : has
  JobPosting ||--o{ Keyword : has
  JobPosting ||--o{ TailoredCV : target_of
  TailoredCV ||--o{ MatchResult : has
  Requirement ||--o{ MatchResult : evaluated_in
  MatchResult }o--o{ Bullet : evidence
  TailoredCV ||--o{ Suggestion : has
  Suggestion }o--o{ Bullet : evidence
  TailoredCV ||--o{ Export : produces
```

## Entidades

- **Profile**: perfil maestro (contacto, resumen, idioma del texto, idioma del CV e idiomas hablados), con estado `needs_review` o `confirmed`. Contiene `Experience`, `Education`, `SkillEntry` y `Project`. Cada `Bullet` tiene un id estable, único en todo el perfil, para citarlo como evidencia. Confirmar exige nombre, idioma del texto y, cuando el bloque existe, organización y rol en cada experiencia, institución y título en cada formación, y nombre en cada proyecto. Los idiomas hablados son opcionales: cada uno tiene nombre y nivel (`native`, `A1`…`C2`). `displayLanguage` es `es` o `en` y solo cambia rótulos, meses y el nombre del nivel.
- **JobPosting**: texto original, título, empresa, idioma, hash.
- **Requirement**: texto, tipo (técnico o funcional), prioridad (obligatorio, deseable o sin especificar), y las `Keyword` que ese requisito pide (`keywordIds`, explícito desde la Fase 3 del plan de auditoría, ADR-027).
- **Keyword**: término canónico, alias, frecuencia, origen.
- **TailoredCV** (agregado raíz de la revisión): versión adaptada de un Profile para un JobPosting, con estado (borrador, en revisión, final) y snapshot de contenido. Posee sus `Suggestion`, `MatchResult` y `Export`.
- **MatchResult**: requisito, estado (cubierto, parcial, brecha), IDs de evidencia, nota.
- **Suggestion**: objetivo (resumen, bullet, orden de habilidades u orden de bullets de un empleo o de un proyecto), antes, después, motivo, evidencia, estado (`pending`, `accepted`, `edited`, `rejected`) y resultado de validación (`not_checked`, `valid` o `invalid`). Solo se revisa desde `pending`. Editar sustituye el texto y vuelve a dejar la validación en `not_checked`.
- **Export** (`CvExport`): clave de almacenamiento del PDF (`storageKey`), fecha (`createdAt`) y versión (desde 1).
- **SkillEntry** incluye `source`: `extracted_from_cv` o `declared_by_user` (ADR-018).

## Invariantes

- Toda `Suggestion` debe referenciar al menos un `Bullet` o campo del perfil existente como evidencia (ADR-018).
- El texto resultante de una `Suggestion` no puede contener términos técnicos, empresas, cifras o fechas ausentes del perfil o de las habilidades declaradas por el usuario (fabrication guard, ADR-018).
- No se exporta un `TailoredCV` mientras quede una sugerencia `pending`. Hace falta el estado `final` (ADR-025). La vista previa sí puede mostrarse antes: `pending` y `rejected` dejan el texto original.
- La instantánea de un `TailoredCV` es un perfil `confirmed`, y su id coincide con `profileId`. La evidencia citada tiene que existir en esa instantánea. Un `MatchResult` cubierto o parcial incluye al menos un bullet; una brecha puede no traer ninguno.
- Los datos de contacto del perfil (nombre, email, teléfono, ubicación, enlaces y la foto opcional) no se envían al LLM; se reinsertan al renderizar el HTML (ADR-019). `profileForModel` devuelve el perfil sin ese bloque. Los idiomas hablados sí viajan: son un dato declarado y no son contacto. La foto es un data URI de JPEG, PNG o WebP, de hasta 1 MiB, o null.
- Un `Requirement.keywordIds` solo puede citar keywords que están en el `JobPosting.keywords` de la misma oferta, sin repetir ninguna (ADR-027). Un documento guardado antes de esa fase, sin ese campo, se normaliza a `keywordIds: []` al leer.

## Representación

Las entidades viven en `packages/domain` y se validan con Zod. El perfil confirmado se persiste como una fila de `Profile` cuyo `document` es el agregado en `jsonb`; al leerlo se vuelve a validar con el mismo esquema. Los identificadores son UUID. Las fechas de experiencia y educación son un mes (`AAAA-MM`) más `ongoing`: un período en curso no tiene fecha de fin, y el fin no puede ser anterior al inicio. Los ids de cada colección son únicos, igual que los nombres de habilidad (sin distinguir mayúsculas).

La evidencia de una sugerencia es un bullet, una habilidad, el resumen, una experiencia, una formación o un proyecto. Si el objetivo es un bullet, la evidencia incluye ese bullet; si es el resumen, cita el resumen; si es el orden de habilidades, cita una habilidad; si es el orden de bullets, cita un bullet de ese empleo o de ese proyecto (Fase 6.1, ADR-030). `checkFabrication` revisa el texto resultante sin llamar a un modelo. Rechaza una cifra, una fecha, un acrónimo, un término del diccionario o de la oferta, o un nombre propio, cuando el perfil no lo respalda ni por el texto ni por un alias del mismo grupo. Una frase de la tabla de categorías entra solo si un bullet citado tiene la evidencia de esa fila (Fase 4.4): Qdrant permite «base de datos vectorial», y colas de Redis o Celery permiten «procesamiento asíncrono». Una habilidad sin bullet no alcanza. Esa frase no autoriza otro producto, ni una cifra, una empresa o una fecha que el perfil no tiene. Una habilidad del perfil, extraída o declarada por el usuario, respalda su nombre. El orden de habilidades tiene que ser la misma lista, en cualquier orden. El orden de bullets también: son los textos de un solo empleo o de un solo proyecto, uno por línea, sin altas ni bajas. Un bloque con menos de dos bullets no se reordena. Si dos textos pliegan igual, la sugerencia es inválida. Ese orden no pasa por el control de términos. `tailoredCvStatusFor` deja el `TailoredCV` en `draft` sin sugerencias, en `in_review` si queda alguna `pending`, y en `final` cuando todas fueron aceptadas, editadas o rechazadas.

`profileForRender` arma el perfil que se imprime a partir de esa instantánea. Aplica una sugerencia solo si está `accepted` o `edited` y el fabrication guard la marcó `valid`. Una `pending` o `rejected` deja el texto original. Un bullet sustituye el texto de ese bullet, en una experiencia o en un proyecto. El resumen sustituye el resumen. El orden de habilidades es una línea por habilidad y reordena las mismas entradas, conservando id, nombre y origen; si no es esa lista, no se imprime. El orden de bullets reordena los de un empleo o de un proyecto: las líneas se leen en la instantánea y el orden se aplica por id, así una reescritura del mismo bloque no lo desarma. Si la lista no es esa, no se imprime. El contacto, la foto, los idiomas hablados y el idioma del CV no cambian con una sugerencia. La instantánea guardada tampoco. La plantilla imprime ese perfil en una columna A4: contacto con iconos, foto circular si hay, perfil, experiencia, proyectos, habilidades, educación e idiomas (ADR-026). Ese HTML se convierte a PDF en el servicio `renderer` (ADR-024). `ExportTailoredCv` lo guarda solo si el estado es `final`: suma una `CvExport` con versión correlativa y escribe el archivo en `FileStorage`. Una sugerencia `pending` bloquea la exportación. Un borrador sin sugerencias tampoco se exporta.

## Oferta y cobertura

`normalizeKeywordDrafts` pliega mayúsculas, acentos y puntuación, y une términos del diccionario de alias (`Postgres` con `PostgreSQL`, `JS` con `JavaScript`). No mezcla grupos distintos: `Java` no es alias de `JavaScript`, ni `SQL` de `PostgreSQL`. La frecuencia se suma y los orígenes se concatenan.

`matchProfileToJob` compara el perfil confirmado con la oferta guardada y devuelve un informe, no una entidad persistida. Cada requisito sale cubierto si todos sus términos aparecen en bullets, parcial si aparece solo una parte, y brecha si no hay bullet. La evidencia de un cubierto o parcial es al menos un bullet. Una habilidad que coincide, sin bullet, deja el requisito en brecha y lo explica en la nota. Una tabla corta de categorías (Fase 4.1) deja en parcial un requisito que nombra la categoría cuando un bullet tiene la evidencia de esa fila: Qdrant respalda «base de datos vectorial», y colas de Redis o Celery respaldan «procesamiento asíncrono». Esa evidencia no cubre el requisito ni otro producto de la misma familia (Fase 4.2: Pinecone, RabbitMQ, SQS, Next.js, Prisma, la API de Anthropic, microservicios). Si el requisito nombra el producto y la categoría, queda parcial: falta el producto y la nota explica la categoría. Esa nota dice si los bullets que respaldan la fila son de un empleo, de un proyecto, o de los dos (Fase 4.3). El texto literal del requisito sigue cubierto. Una keyword está presente si aparece en un bullet, una habilidad, el resumen, un rol, un estudio o un proyecto; si no está, no se puede incorporar. El informe incluye el texto de los bullets citados. Si los idiomas difieren, `languageNotice` lo dice y los textos no se traducen (ADR-022). Si el texto de la oferta pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces, `linksNotice` lo dice (ADR-029). Ese aviso no es un requisito ni cambia `MatchResult`.
