# 07 - Plan de la auditoría de matching

Estado: las Fases 0, 1, 2, 3, 4, 5 y 6 están hechas. La Fase 4 se fraccionó en 4.1 a 4.5. La Fase 5 se fraccionó en 5.1 a 5.4. La Fase 6 se fraccionó en 6.1 a 6.4. Las fases de este archivo son posteriores a la Fase 5 del [roadmap](05-roadmap.md). No renumeran ese roadmap.

Origen: [informe técnico](manual_tests/informe_tecnico_cv_tailor_cursor.md), [caso FinPulse](manual_tests/informe_de_auditor_a_ats_e_ia_generador_de_cvs.md) y [caso Full Stack LATAM](manual_tests/informe_auditoria_ats_ia_fullstack_latam.md). El índice de esos informes está en [manual_tests/index.yml](manual_tests/index.yml).

Al cerrar una fase: marcarla hecha aquí, actualizar la sección "Estado actual" de [README.md](README.md) y, si la fase cambió un contrato o una decisión, crear el ADR y tocar [pendientes.md](decisions/pendientes.md).

## Qué ya hace el código

No rehacerlo en estas fases.

- La extracción copia el CV en su idioma y sin contacto. Los ids de bullets, experiencias, proyectos y habilidades son UUID y duran lo que dura el perfil guardado.
- `analyzeJobGraph` saca requisitos y keywords. El dominio unifica alias (`Postgres` / `PostgreSQL`, `JS` / `JavaScript`) y no mezcla tecnologías parecidas (`Java` no sale de `JavaScript`).
- `matchProfileToJob` compara en código, sin modelo y sin embeddings. `covered` si todos los términos están en bullets de experiencia o de proyecto, `partial` si está solo una parte, `gap` si no hay bullet. Una habilidad sin bullet no cubre el requisito: la nota lo dice.
- La tabla de categorías (Fase 4.1) deja en `partial` «base de datos vectorial» si un bullet tiene Qdrant, y «procesamiento asíncrono» si tiene colas de Redis o Celery. No cubre el requisito. Redis como caché no entra. La Fase 4.2 fija que esa evidencia no cubre otro producto (Pinecone, RabbitMQ, SQS, Next.js, Prisma, la API de Anthropic, microservicios). Si el requisito nombra el producto y la categoría, queda `partial`: falta el producto y la nota explica la categoría. La nota de categoría dice si el bullet es de un empleo, de un proyecto, o de los dos (Fase 4.3). `checkFabrication` acepta la frase de esa fila solo si un bullet citado tiene la evidencia (Fase 4.4). Una habilidad sin bullet no alcanza, y otro producto, una cifra, una empresa o una fecha siguen sin entrar.
- `proposeTailoringGraph` reformula el resumen, reescribe un bullet, reordena las habilidades que ya existen o reordena los bullets de un empleo o de un proyecto (Fase 6.2). El fabrication guard descarta un término, una cifra, una empresa o una fecha que el perfil no respalda. Cada sugerencia se acepta, edita o rechaza por separado.
- El contacto ya tiene `links`. La plantilla imprime nombre, teléfono, email, enlaces y ubicación. El nombre sale completo, en mayúsculas. Un encabezado «ALEJANDRO» es el `contact.name` guardado. Si el nombre tiene una sola palabra, el editor lo avisa y la confirmación sigue (Fase 5.1). Si el texto de la oferta pide un enlace a GitHub o a un portfolio y `links` está vacío, `linksNotice` lo dice (Fase 5.2); la pantalla de la oferta lo muestra junto al aviso de idioma (Fase 5.3).
- `skill_order` ya puede adelantar habilidades existentes. Desde la Fase 6.1, `bullet_order` puede reordenar los bullets de un empleo o de un proyecto, sin reescribirlos. Desde la Fase 6.2 el prompt puede proponerlo: una lista completa por bloque, con los mismos textos.
- El perfil guarda idiomas hablados y `displayLanguage`. La plantilla imprime esa sección, los iconos de contacto y la foto opcional. Al analizar una oferta nueva, el informe anterior no queda en pantalla.

## Qué queda fuera

Traducir el texto del CV, sea al idioma de la oferta o al idioma elegido para mostrarlo (ADR-022). Escribir TypeScript, SOLID, testing o un ORM porque se infieren de Angular, de Django o de otro stack (ADR-018). Agrupar habilidades en categorías (ADR-026). Reescribir una cifra como «casi 5 años». Inventar dominio fintech o SaaS B2B. Presentar un porcentaje como probabilidad de pasar un ATS. Sumar embeddings. Esos cambios piden un ADR que reemplace ADR-018, ADR-022 o ADR-026.

La modalidad del puesto (medio tiempo, freelance) sigue afuera: `Experience` no guarda ese dato. Los idiomas hablados y la foto opcional entran en la Fase 0, con campos nuevos y una actualización de ADR-026.

## Hallazgos que ordenan el plan

Con la oferta y el CV en español, faltan igual TypeScript, Jest, Vitest, Testing Library, SOLID, arquitectura hexagonal, Next.js y los ORM nombrados. El idioma no explica esos huecos. Si no están escritos en el perfil, omitirlos es el comportamiento correcto. Para poder citarlos, la persona los carga en el perfil con una evidencia.

React sin Next.js, y PostgreSQL sin Prisma, TypeORM ni Sequelize, son cobertura parcial. Colas de Redis o Celery respaldan procesamiento asíncrono y no respaldan RabbitMQ ni SQS. Qdrant no respalda Pinecone.

El texto evaluado en los dos casos tiene la forma del perfil confirmado renderizado (mismos bullets, mismas fechas, mismos rótulos). Hasta ver una exportación hecha después de aceptar sugerencias, el orden PHP/Django primero se trata como dato del perfil maestro.

La oferta LATAM separa responsabilidades, requisitos excluyentes y deseables. Con el prompt actual, lo que no dice «deseable» queda `required`, también una ceremonia ágil o el texto de «Cómo aplicar».

## Fase 0 - Perfil visible y espera de la oferta

Estado: hecha (2026-11-16). Va antes que las fases de matching. ADR-026 quedó actualizado en el mismo cambio: el perfil guarda idiomas hablados y una foto opcional, y la plantilla los imprime. El título bajo el nombre, los grupos de habilidades y el párrafo de presentación del puesto siguen fuera.

### Idiomas hablados

Hoy `profile.language` es una etiqueta del idioma en que está escrito el CV (`es`, `en`). El editor la llama «Idioma» y la plantilla la usa para los rótulos y los meses. No hay lista de idiomas que la persona habla, y ADR-026 los dejaba fuera porque el perfil no tenía el campo.

Se agrega una lista opcional, aparte de esa etiqueta. Cada ítem tiene el nombre del idioma y un nivel cerrado:

| Nivel | Cómo se muestra en español |
| --- | --- |
| `native` | Nativo |
| `A1` | Principiante |
| `A2` | Elemental |
| `B1` | Intermedio |
| `B2` | Intermedio alto |
| `C1` | Avanzado |
| `C2` | Maestría |

Español nativo e inglés B1 quedan como dos ítems: «Español · Nativo» e «Inglés · B1 · Intermedio». La lista puede ir vacía y el perfil igual se confirma. No los inventa el extractor: se cargan en el editor. Viajan en `profileForModel`, porque son un dato declarado y no son contacto. La foto y el contacto siguen sin ir al modelo (ADR-019).

### Idioma en que se muestra el CV

Un campo nuevo, `displayLanguage`, con `es` o `en`. Lo elige quien edita el perfil. Si falta en un documento ya guardado, vale el idioma del texto.

La plantilla usa ese campo para los rótulos de sección, los meses y los nombres de nivel. El resumen, los bullets, las habilidades y el resto del texto quedan en el idioma en que fueron escritos (ADR-022). Elegir inglés no traduce el CV: cambia «Perfil profesional» por «Professional profile» y «Noviembre» por «November».

En el editor, la etiqueta actual pasa a llamarse idioma del texto, y el control nuevo, idioma del CV.

### Iconos de contacto

El contacto ya guarda teléfono, email, ubicación y enlaces (`label` + `url`). La plantilla los imprime como texto, en una grilla de dos columnas.

Cada dato visible lleva un SVG propio, embebido en el HTML. El renderer no descarga una fuente de iconos. Teléfono, email y ubicación tienen icono fijo. En un enlace, el icono sale del host:

- LinkedIn, GitHub, Instagram, WhatsApp (`wa.me`, `api.whatsapp.com`), Telegram, X, Facebook, YouTube.
- Cualquier otra URL usa un icono genérico de enlace.

El texto del dato sigue al lado del icono, para que un ATS lea el teléfono, el email y la URL. El editor no pide elegir el icono.

### Foto de perfil opcional

Un campo opcional en el contacto. Si no hay foto, el encabezado queda como ahora. Si hay, la plantilla la muestra circular junto al nombre.

La imagen viaja dentro del HTML como data URI, porque el `renderer` recibe el HTML y no lee el volumen de archivos. Se guarda en el documento del perfil, con un tope de tamaño (1 MiB) y tipos `image/jpeg`, `image/png` o `image/webp`. No se envía al modelo.

### Spinner al analizar

`submit` en `apps/web/app/job-flow.tsx` marca la actividad `analyze` y deja `flow.job` con la oferta anterior. `JobReport` sigue en pantalla hasta que llega la respuesta, así que requisitos y keywords son los de la oferta previa. El botón ya dice «Analizando…».

Mientras `activity.kind` es `analyze`, esa zona de abajo muestra un spinner y no el informe anterior. El formulario sigue visible. Si el análisis falla, vuelve el informe que ya estaba. Actualizar la cobertura de la misma oferta no entra: ahí el informe es el vigente y el botón ya dice «Actualizando cobertura…».

### Contrato y documentos viejos

El perfil y la instantánea del `TailoredCV` se validan con `profileSchema`, un objeto estricto guardado en `jsonb`. Un documento sin los campos nuevos tiene que leerse igual: idiomas vacíos, foto ausente, idioma del CV igual al idioma del texto. Eso se normaliza al leer, sin migración SQL.

La foto y los idiomas no son objetivo de una sugerencia. `profileForRender` los copia de la instantánea.

### Archivos previstos

- `packages/domain/src/profile/contact.ts`, `profile.ts` (`profileForModel`, `confirmProfile`) y sus tests.
- `packages/adapter-cv-template/src/render-cv-html.ts` y `render-cv-html.test.ts`.
- `apps/web/app/profile-editor.tsx` y `apps/web/app/job-flow.tsx`.
- Fixtures y tests que arman un perfil a mano, porque el esquema estricto deja de aceptar el objeto viejo si no pasan por la normalización.
- ADR-026, [03-modelo-de-dominio.md](03-modelo-de-dominio.md) y [06-uso.md](06-uso.md).

### Criterio de aceptación

- Se puede cargar español nativo e inglés B1, y el PDF los muestra con el nivel en palabras.
- Con idioma del CV en inglés, los rótulos y los meses salen en inglés y los bullets siguen en el idioma del texto.
- Teléfono, email, ubicación y un enlace de LinkedIn, Instagram o WhatsApp muestran su icono y el texto.
- Sin foto, el encabezado no reserva un hueco. Con foto, se ve circular y no aparece en el JSON que viaja al modelo.
- Al analizar una oferta nueva, el informe de la oferta anterior desaparece mientras dura la espera, y reaparece si la llamada falla.

## Fase 1 - Prompts

Estado: hecha (2026-11-16). No cambió esquemas ni contratos.

Archivos:

- `packages/adapter-ai/src/analyze-job/prompt.ts` y `prompt.test.ts`
- `packages/adapter-ai/src/extract-profile/prompt.ts` y `prompt.test.ts`
- `packages/adapter-ai/src/propose-tailoring/prompt.ts` y `prompt.test.ts`

Criterio de aceptación:

- Un requisito es una capacidad completa. «Diseñar, desarrollar y mantener funcionalidades end-to-end» queda en un solo ítem. Un verbo o una palabra gramatical no se vuelven un requisito.
- Si la oferta tiene una sección de excluyentes, eso es `required`. Si tiene deseables, plus, bonus o no excluyentes, eso es `preferred`. «Cómo aplicar», salario y beneficios no entran como requisitos.
- Cada bullet de la extracción conserva su empleo o su proyecto. No se fusionan afirmaciones que cambian de contexto. Una habilidad declarada no se convierte en experiencia.
- En la propuesta, la evidencia citada sostiene el texto nuevo y el alcance del bullet no crece. Un término de la oferta entra si el perfil ya lo dice o si el diccionario de alias lo equipara.
- El esquema sigue en `required` | `preferred`. `unspecified` espera la Fase 3.

## Fase 2 - Tests del matching léxico

Estado: hecha (2026-11-16). Se fraccionó en cuatro sub-fases para facilitar la corrección manual de cada tanda. Fija el comportamiento actual. No lo cambia.

Archivo único para las cuatro: `packages/domain/src/tailoring/match-profile.test.ts`. Datos sintéticos, sin el CV real. Cada sub-fase agrega su propio `describe` al archivo, con perfiles y ofertas mínimos para ese caso, y no toca los `describe` de las sub-fases anteriores.

La Fase 4.1 deja en `partial` el requisito que nombra la categoría («procesamiento asíncrono», «base de datos vectorial») cuando el bullet tiene la evidencia de la tabla. Los tests de la Fase 2.3 siguen en `gap`: ahí el requisito nombra el producto (RabbitMQ, SQS, Pinecone), no la categoría.

### Fase 2.1 - Cobertura exacta y por alias

Estado: hecha (2026-11-16).

| Perfil | Requisito | Estado |
| --- | --- | --- |
| PostgreSQL en un bullet | PostgreSQL | `covered` |
| Postgres en un bullet | PostgreSQL | `covered`, por alias |

### Fase 2.2 - Cobertura parcial

Estado: hecha (2026-11-16).

| Perfil | Requisito | Estado |
| --- | --- | --- |
| React en un bullet, sin Next.js | React y Next.js | `partial` |
| PostgreSQL, sin Prisma, TypeORM ni Sequelize | PostgreSQL o MySQL, y un ORM de esa lista | `partial` |

### Fase 2.3 - Brechas por término no relacionado

Estado: hecha (2026-11-16).

| Perfil | Requisito | Estado |
| --- | --- | --- |
| Colas de Redis, sin RabbitMQ ni SQS | RabbitMQ o SQS | `gap` |
| JavaScript, sin la palabra TypeScript | TypeScript | `gap` |
| Qdrant, sin Pinecone | Pinecone | `gap` |
| JavaScript, pidiendo Java | Java | `gap` |

### Fase 2.4 - Brecha por habilidad sin bullet

Estado: hecha (2026-11-16).

| Perfil | Requisito | Estado |
| --- | --- | --- |
| Jest solo en habilidades | Jest | `gap`, con nota de habilidad sin bullet |

Las cuatro sub-fases quedaron hechas. `match-profile.test.ts` tiene, además del `describe` original (`matchProfileToJob`), un `describe` por cada sub-fase (2.1 a 2.4), con perfiles y ofertas sintéticos propios de cada caso.

## Fase 3 - Decisiones de esquema

Estado: hecha (2026-11-16). ADR-027 resolvió las tres decisiones.

1. **Prioridad.** `requirementPrioritySchema` suma `unspecified`, para una responsabilidad o mención suelta que la oferta no marca como excluyente ni como deseable. Es un cambio de enum, no de forma: un requisito ya guardado con `required` o `preferred` sigue siendo válido, sin normalización al leer. Una oferta ya analizada solo recibe `unspecified` si se vuelve a analizar.
2. **Detalle de la brecha.** `MatchStatus` sigue en `covered` | `partial` | `gap`. El detalle (concepto ausente, habilidad sin bullet, y más adelante una tecnología de la misma categoría en la Fase 4) se expresa como texto de `MatchResult.note`, no como un estado nuevo.
3. **Keywords de cada requisito.** `Requirement` suma `keywordIds`, explícito. El prompt de `analyze-job` pide `keywordTerms` por requisito y `analyzeJobPosting` los resuelve a `KeywordId` después de deduplicar las keywords, incluso por alias de diccionario. `matchProfileToJob` usa esa relación como señal adicional, sumada al cálculo por texto existente. Un documento guardado antes de esta fase se normaliza a `keywordIds: []` al leer, sin migración SQL.

No se sumó `confidence` ni un porcentaje de cobertura.

## Fase 4 - Equivalencias de categoría

Estado: hecha (2026-11-16). Se fraccionó en cinco sub-fases para revisar cada tanda por separado. Sigue siendo `matchProfileToJob`, sin un segundo modelo y sin embeddings. ADR-027 dejó `MatchStatus` en `covered` | `partial` | `gap`: una tecnología de la misma categoría se dice en `MatchResult.note` y no produce un `covered`.

La tabla vive en `packages/domain/src/tailoring/category-equivalences.ts`. Cada fila tiene la frase del requisito, las frases que en un bullet cuentan como evidencia, y el nombre de la categoría que va en la nota. Lo que no está en la tabla no se infiere. Una habilidad sin bullet no entra: sigue en `gap`.

### Fase 4.1 - La categoría queda en partial

Estado: hecha (2026-11-16).

| Bullet | Requisito | Estado | Nota |
| --- | --- | --- | --- |
| Qdrant | bases de datos vectoriales, o «vector database» | `partial` | «Qdrant» respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito. |
| colas de Redis | procesamiento asíncrono | `partial` | «colas de Redis» respalda la categoría «procesamiento asíncrono» y no alcanza para cubrir el requisito. |
| Celery | procesamiento asíncrono | `partial` | «Celery» respalda la categoría «procesamiento asíncrono» y no alcanza para cubrir el requisito. |
| colas de Redis y Celery | procesamiento asíncrono | `partial` | los dos términos, en el orden de la tabla |
| el propio texto «bases de datos vectoriales» | bases de datos vectoriales | `covered` | el léxico gana; Qdrant al lado no lo baja a `partial` |
| Qdrant solo en habilidades | bases de datos vectoriales | `gap` | sin evidencia en el perfil |
| Redis como caché, sin colas ni Celery | procesamiento asíncrono | `gap` | sin evidencia en el perfil |

Un bullet de proyecto cuenta igual que uno de empleo. Desde la 4.3, la nota dice «en un empleo», «en un proyecto», o las dos cosas.

### Fase 4.2 - Lo que la tabla no cubre

Estado: hecha (2026-11-16). No agregó filas. Estas parejas siguen en `gap`, con la nota «Sin evidencia en el perfil.».

| Bullet | Requisito | Estado |
| --- | --- | --- |
| Qdrant | Pinecone | `gap` |
| colas de Redis | RabbitMQ o SQS | `gap` |
| Celery | RabbitMQ o SQS | `gap` |
| React | Next.js | `gap` |
| Django | Prisma | `gap` |
| modelos de OpenAI | API de Anthropic | `gap` |
| FastAPI | microservicios | `gap` |

«Experiencia con RabbitMQ o procesamiento asíncrono», con un bullet de colas de Redis, queda `partial`. La nota dice que falta RabbitMQ y que «colas de Redis» respalda la categoría. Los tests de la Fase 2.3 no se reescribieron.

### Fase 4.3 - Empleo o proyecto en la nota

Estado: hecha (2026-11-16). La nota de categoría suma el origen de los bullets que respaldan la fila. No hay campo nuevo en `MatchResult`.

| Bullets que respaldan la categoría | Fragmento |
| --- | --- |
| uno o más, todos de un empleo | en un empleo |
| uno o más, todos de un proyecto | en un proyecto |
| al menos uno de cada uno | en un empleo y en un proyecto |

La frase queda así: «Qdrant», en un empleo, respalda la categoría «base de datos vectorial» y no alcanza para cubrir el requisito. Un empleo sin esa evidencia no cambia el origen: si Qdrant está solo en un proyecto, la nota dice «en un proyecto». Una nota léxica, como la de Next.js que falta cuando hay React, no dice de dónde sale el bullet.

### Fase 4.4 - El fabrication guard y el término de la categoría

Estado: hecha (2026-11-16). `checkFabrication` acepta en el texto nuevo una frase de la fila solo cuando un bullet citado tiene la evidencia. Sirve cualquier frase de `requirementPhrases` (el singular y el plural de la base vectorial). Citar el bullet de Qdrant alcanza aunque el texto reescriba otro bullet. Una habilidad sin bullet no alcanza, ni un bullet con la evidencia que no se cita. Redis como caché, sin colas ni Celery, no permite «procesamiento asíncrono».

| Bullet citado | Texto nuevo | Resultado |
| --- | --- | --- |
| Qdrant | base de datos vectorial, o el plural | válido |
| colas de Redis | procesamiento asíncrono | válido |
| Celery, también en un proyecto | procesamiento asíncrono | válido |
| Qdrant | la frase, más Pinecone, una cifra, una empresa o una fecha | inválido |
| colas de Redis | RabbitMQ | inválido |
| Celery | SQS | inválido |
| React | Next.js | inválido |
| Django | Prisma | inválido |
| modelos de OpenAI | Anthropic | inválido |
| FastAPI | microservicios | inválido |

### Fase 4.5 - La nota en la pantalla

Estado: hecha (2026-11-16). La pantalla no cambió. En la pestaña Requisitos, que es la que se abre, cada requisito muestra la nota completa debajo del estado y encima de los bullets citados. `GET /jobs/:id/match` devuelve el informe del dominio, y la página lo acepta con `jobMatchReportSchema`, que incluye `note`. Ahí se leen la frase de la 4.1 y el origen de la 4.3. Una nota léxica, como la de una brecha, sale por el mismo lugar. Keywords no repite esa nota.

## Fase 5 - Datos del perfil en la pantalla

Estado: hecha (2026-11-16). Se fraccionó en cuatro sub-fases. No agregó campos al perfil: el nombre y `contact.links` ya existían, y la plantilla ya los imprime. El renderer no cambió. La pregunta de brecha no entró en esta fase.

### Fase 5.1 - Aviso de nombre de una sola palabra

Estado: hecha (2026-11-16). Solo la pantalla del perfil. `confirmProfile` sigue aceptando un nombre de una palabra: el aviso no bloquea el guardado.

El aviso se lee en Contacto, debajo del campo Nombre, mientras el texto recortado tiene una sola palabra (separadas por espacios). Sigue visible si el perfil ya está confirmado y el nombre guardado es de una palabra. El texto del aviso: «El nombre tiene una sola palabra. El PDF imprime ese texto tal cual.»

| Nombre en el campo | Aviso |
| --- | --- |
| ALEJANDRO | sí |
| Ada | sí |
| Ada Lovelace | no |
| María José | no |
| Ada y Lovelace, con espacios de más en el medio | no |
| García-López | sí: el guion no parte la palabra |
| vacío | no es este aviso: confirmar sigue exigiendo un nombre |

[06-uso.md](06-uso.md) suma una frase en la confirmación: un nombre de una palabra se guarda, y la pantalla lo avisa.

Archivo: `apps/web/app/profile-editor.tsx`.

### Fase 5.2 - El informe avisa si faltan enlaces

Estado: hecha (2026-11-16). ADR-029. `matchProfileToJob` mira `job.rawText` y `contact.links`. No mira los requisitos: desde la Fase 1, «Cómo aplicar» no entra como requisito, y es ahí donde la oferta LATAM pide el enlace.

El informe suma `linksNotice`, un string o `null`, al lado de `languageNotice`. El informe no se persiste. El contrato quedó en ADR-029. Una respuesta vieja no se migra.

Hay aviso solo si `links` está vacío y el texto de la oferta, sin distinguir mayúsculas, contiene alguna de estas frases: `portfolio`, `portafolio`, `enlace a github`, `link to github`, `github link`. Una sola frase alcanza, y no se acumulan avisos. El texto del aviso: «La oferta pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces.»

Cualquier enlace alcanza para callar el aviso, también uno que no sea GitHub. Lo que no está en la lista no se infiere.

| El texto de la oferta contiene | `links` | `linksNotice` |
| --- | --- | --- |
| enlace a GitHub/portfolio | vacío | la frase |
| portafolio | vacío | la frase |
| link to GitHub | vacío | la frase |
| GitHub link | vacío | la frase |
| GitHub Actions, sin otra frase de la lista | vacío | `null` |
| GitHub/GitLab y pull requests, sin otra frase | vacío | `null` |
| la palabra GitHub sola | vacío | `null` |
| enlace a GitHub | un enlace cualquiera | `null` |
| ninguna frase de la lista | vacío | `null` |

`languageNotice` no cambia. Los `MatchResult` tampoco. Un `describe` nuevo en `match-profile.test.ts`, con datos sintéticos, sin tocar los `describe` anteriores.

Archivos: `packages/domain/src/tailoring/match-profile.ts` y `match-profile.test.ts`. El esquema viaja por `contracts`; la pantalla lo acepta y no lo muestra hasta la 5.3.

### Fase 5.3 - El aviso de enlaces en la pantalla

Estado: hecha (2026-11-16). La pantalla no cambió de estructura. Arriba del recuento, donde ya se lee `languageNotice`, se lee `linksNotice` en su propio párrafo, con el mismo recuadro. Si los dos existen, primero el de idioma. Keywords no lo repite. Un informe sin el aviso no reserva el hueco.

No hay otro cambio de pantalla. El dato llega en `GET /jobs/:id/match`.

Archivo: `apps/web/app/job-flow.tsx`.

### Fase 5.4 - Lo que se completa a mano

Estado: hecha (2026-11-16). No hubo código. La pregunta de brecha sigue afuera: cuando exista, la respuesta se guardará como habilidad `declared_by_user` o como bullet, y recién ahí podrá entrar en una propuesta.

[06-uso.md](06-uso.md) dice cómo se carga cada hueco en el editor, que ya permite las tres cosas:

- TypeScript, testing, SOLID y arquitectura hexagonal se escriben en un bullet de un empleo o de un proyecto. Una habilidad declarada, sin ese bullet, deja el requisito en `gap` (Fase 2.4). La habilidad sí puede reordenarse en una propuesta.
- El inglés técnico se carga como idioma hablado, con su nivel (Fase 0). No es una habilidad.

Archivo: `docs/06-uso.md`.

## Fase 6 - Orden de los bullets

Estado: hecha (2026-11-16). El motor dejaba los bullets en el orden de la instantánea. Se fraccionó en cuatro sub-fases. El contrato incluye empleos y proyectos (ADR-030).

En un puesto como el de la oferta LATAM, el orden sube el trabajo con React, Node y PostgreSQL, y deja más arriba LangChain, LangGraph y RAG cuando la oferta los marca como deseables. `skill_order` ya cubre el adelanto dentro de la lista de habilidades y no depende de esta fase.

### Fase 6.1 - El dominio reordena sin reescribir

Estado: hecha (2026-11-16). ADR-030.

El objetivo es `{ type: "bullet_order", owner }`. `owner` es un empleo (`experienceId`) o un proyecto (`projectId`). `before` y `after` son los textos de ese bloque, uno por línea. El guard exige la misma lista, plegada como las habilidades: sin altas, sin bajas, sin textos cambiados y sin repetidos. No pasa por el control de términos. Un bloque con menos de dos bullets no se reordena. Si dos textos pliegan igual, o un bullet ocupa más de una línea, la sugerencia es inválida. La evidencia es al menos un bullet de ese bloque.

`profileForRender` resuelve el orden contra los textos de la instantánea y lo aplica por id. Una reescritura ya aceptada del mismo bloque no desarma el orden. Los ids y los textos se conservan. Una sugerencia ya guardada, sin este tipo, sigue siendo válida. No hay migración.

| Bloque | `after` | Resultado |
| --- | --- | --- |
| empleo con React y PostgreSQL | PostgreSQL, luego React, aunque cambien las mayúsculas | válido |
| proyecto con dos bullets | el segundo y después el primero | válido |
| el mismo orden de partida | la misma lista | válido |
| un texto que no es un bullet de ese bloque | una línea nueva | inválido: nombra la línea y el bullet que falta |
| lista incompleta, o un bullet repetido | falta uno, o el mismo dos veces | inválido |
| dos bullets que pliegan igual | los dos textos | inválido |
| menos de dos bullets | el único texto, o ninguno | inválido |
| evidencia de otro empleo, o una habilidad | la lista correcta | inválido |
| un id de empleo o de proyecto que no está | la lista correcta | inválido |
| un bullet con un salto de línea | los textos | inválido |

Archivos: `packages/domain/src/tailoring/suggestion.ts`, `fabrication-guard.ts`, `apply-suggestions.ts` y sus tests. El generador ya distingue una sugerencia por bloque, para que dos órdenes no se pisen. La pantalla tenía el rótulo «Orden de bullets» para que el tipo compile. El nombre del bloque entró en la 6.3.

### Fase 6.2 - El prompt puede proponer el orden

Estado: hecha (2026-11-16).

`targetType` suma `bullet_order`. `ownerType` es `experience` o `project`, y `ownerId` es el id de ese bloque. En los otros objetivos los dos van en null, igual que `bulletId` cuando el objetivo no es un bullet. `after` es la lista completa, un texto por línea, con los mismos textos. El prompt pide subir lo que la oferta pide, y poner los excluyentes antes de los deseables. Una sola sugerencia por bloque. Un bloque con un solo bullet no se reordena. El guard sigue rechazando una línea reescrita.

| Salida del modelo | Resultado |
| --- | --- |
| `ownerType: experience` y la lista invertida de ese empleo | sugerencia con `owner.experienceId` |
| `ownerType: project` y la lista invertida de ese proyecto | sugerencia con `owner.projectId` |
| dos órdenes del mismo empleo | queda la primera |
| una línea que no es un bullet de ese empleo | el guard la rechaza; un reintento con la lista original entra |

Archivos: `packages/adapter-ai/src/propose-tailoring/prompt.ts`, `schema.ts`, `prompt.test.ts` y `graph.test.ts`.

### Fase 6.3 - El bloque en la pantalla de revisión

Estado: hecha (2026-11-16).

Junto a «Orden de bullets» la tarjeta dice el rol y la organización (`Desarrolladora en Analytical Engines`) o el nombre del proyecto (`proyecto Motor analítico`). Si ese id no está en la instantánea, el rótulo es «Empleo» o «Proyecto». Aceptar, editar y rechazar siguen igual. Editar una frase sigue yendo al guard, que la deja inválida. El párrafo de la revisión dice que también se puede reordenar sin cambiar el texto.

Archivo: `apps/web/app/proposal-panel.tsx`. El texto del rótulo está en `bullet-order-label.ts`.

### Fase 6.4 - Cómo se usa

Estado: hecha (2026-11-16).

[06-uso.md](06-uso.md) dice que en la revisión un orden de bullets nombra el empleo o el proyecto, y que aceptarlo cambia el orden sin agregar ni borrar bullets. Editar una frase no se guarda.
