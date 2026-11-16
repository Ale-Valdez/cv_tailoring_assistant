# Informe técnico para Cursor: mejoras en CV Tailor

**Objetivo:** revisar y mejorar el flujo de análisis de ofertas,
estructuración del CV, evaluación de compatibilidad y adaptación del
currículum, manteniendo como principio central que ninguna experiencia,
habilidad o logro puede inventarse.

**Alcance de este informe:** recomendaciones basadas en los tres prompts
compartidos: 1. Extracción de información de la oferta laboral. 2.
Estructuración del CV. 3. Propuesta de adaptación del CV.

No se proporcionaron todavía los schemas completos ni el prompt que
genera `matchResults` y `keywords`. Por lo tanto, este documento indica
qué investigar y qué criterios aplicar, pero no presupone la estructura
actual del código ni propone reemplazarla sin inspeccionarla.

------------------------------------------------------------------------

## 1. Instrucciones iniciales para Cursor

Antes de modificar archivos:

1.  Inspeccionar la estructura del repositorio y localizar los prompts,
    schemas, servicios, funciones y tests relacionados con:
    -   análisis de ofertas;
    -   extracción/normalización del CV;
    -   generación de requisitos y keywords;
    -   matching y cálculo de compatibilidad;
    -   selección y almacenamiento de evidencias;
    -   generación de propuestas de adaptación.
2.  Identificar qué modelo, proveedor y configuración se utilizan en
    cada etapa.
3.  Seguir el flujo real de datos desde la entrada hasta el resultado
    que consume la interfaz.
4.  Revisar los schemas y ejemplos reales de entrada/salida.
5.  Identificar si el matching se realiza mediante LLM, código
    determinístico, búsqueda semántica o una combinación.
6.  Revisar los tests existentes y ejecutar los relevantes para
    establecer una línea base.

**No realizar cambios todavía.** Primero presentar un diagnóstico breve
con: - archivos y componentes involucrados; - flujo actual; - estructura
actual de datos; - problemas confirmados; - riesgos de compatibilidad; -
propuesta de cambios por etapas.

No inventar nombres de archivos, funciones, propiedades ni tecnologías.
Adaptar las recomendaciones de este documento a la arquitectura
existente.

------------------------------------------------------------------------

## 2. Principios funcionales

La aplicación debe respetar estos principios:

### 2.1 Veracidad del perfil

-   No inventar empresas, cargos, fechas, estudios, proyectos,
    tecnologías, responsabilidades, cifras ni logros.
-   No convertir una habilidad declarada en experiencia laboral
    demostrada.
-   No atribuir una tecnología a un empleo o proyecto si el CV no
    establece esa relación.
-   No inferir experiencia directa con una tecnología a partir de otra
    tecnología relacionada.
-   Mantener el idioma original del perfil en las propuestas de
    adaptación, salvo que el producto incorpore explícitamente una
    función de traducción.

### 2.2 Separación de conceptos

Mantener diferenciados:

  -----------------------------------------------------------------------
  Concepto                            Significado
  ----------------------------------- -----------------------------------
  Requisito                           Capacidad, conocimiento o
                                      responsabilidad que solicita la
                                      oferta.

  Keyword                             Término que puede ayudar a
                                      identificar un requisito en el CV.

  Skill declarada                     Habilidad que el candidato incluyó
                                      en su sección de habilidades.

  Evidencia                           Fragmento concreto del CV que
                                      respalda una afirmación.

  Coincidencia                        Evaluación de cuánto respalda el
                                      perfil un requisito.

  Propuesta de adaptación             Cambio de redacción respaldado por
                                      el perfil.
  -----------------------------------------------------------------------

Una keyword no constituye por sí sola una evidencia. Una skill tampoco
demuestra automáticamente experiencia profesional.

### 2.3 Trazabilidad

Toda coincidencia relevante debe poder rastrearse hasta una o más
fuentes concretas del perfil. La aplicación debe poder explicar por qué
considera cubierto, parcialmente cubierto o no demostrado un requisito.

------------------------------------------------------------------------

## 3. Etapa A: análisis de la oferta laboral

### 3.1 Problema a revisar

El prompt actual indica:

> `priority` es `preferred` solo cuando la oferta lo marca como
> deseable, plus, bonus o no excluyente. Si no lo dice, es `required`.

Esta regla puede clasificar como obligatorio un concepto que aparece en
la descripción, pero que no está expresamente establecido como requisito
obligatorio.

### 3.2 Recomendación

Si el modelo de datos lo permite, utilizar tres estados:

-   `required`: la oferta indica expresamente que es obligatorio o lo
    presenta inequívocamente como requisito.
-   `preferred`: la oferta lo identifica como deseable, plus, bonus o no
    excluyente.
-   `unspecified`: aparece en el texto, pero no se puede determinar su
    obligatoriedad.

No asumir que todo término mencionado es excluyente.

Si el esquema actual solo permite `required` y `preferred`, presentar
primero el impacto de incorporar `unspecified` y proponer una migración
compatible.

### 3.3 Requisitos compuestos

Extraer capacidades completas, no palabras aisladas.

Ejemplo de texto de oferta:

> Design, develop and maintain REST APIs using external services.

No generar requisitos independientes como: - Design. - Develop. -
Maintain. - Using. - External.

Representar la capacidad como una unidad coherente, por ejemplo:

> Design, develop and maintain REST APIs integrating external services.

Conservar el idioma original y no agregar exigencias que la oferta no
menciona.

### 3.4 Requisito y keywords

Un requisito puede tener varias keywords asociadas.

Ejemplo ilustrativo:

-   Requisito: implementar recuperación aumentada por generación.
-   Keywords: `RAG`, `embeddings`, `vector database`,
    `document retrieval`.

Las keywords ayudan a recuperar posibles evidencias; no deben
convertirse automáticamente en requisitos independientes ni determinar
por sí solas el resultado del matching.

### 3.5 Canonical y aliases

Mantener la regla actual:

-   `canonical`: nombre usual del concepto.
-   `aliases`: formas equivalentes reales.
-   No incluir tecnologías similares como aliases.

Ejemplos: - `PostgreSQL` / `Postgres`: equivalentes. - `React` /
`Angular`: no son equivalentes. - `Qdrant` / `Pinecone`: no son aliases;
son productos distintos de una categoría relacionada.

La frecuencia debe contar menciones del término y de sus aliases, sin
duplicar una misma aparición.

### 3.6 Instrucciones sugeridas para el prompt

Adaptar estas instrucciones al prompt actual, sin reemplazar el resto de
las reglas válidas:

``` text
Identificá requisitos como capacidades, conocimientos o responsabilidades completas, no como palabras aisladas.
No conviertas verbos, adjetivos o palabras gramaticales en requisitos independientes.
Conservá las responsabilidades compuestas cuando formen una sola capacidad.
Clasificá como preferred los requisitos marcados como deseables, plus, bonus o no excluyentes.
Clasificá como required los requisitos expresamente obligatorios.
Usá unspecified cuando el texto no permita determinar la obligatoriedad.
Diferenciá los requisitos de las keywords que ayudan a identificarlos.
No conviertas tecnologías relacionadas en aliases ni en equivalencias.
```

------------------------------------------------------------------------

## 4. Etapa B: estructuración del CV

### 4.1 Mantener la extracción conservadora

El prompt actual contiene buenas restricciones: copiar el contenido sin
traducir, no inventar datos, normalizar fechas y excluir datos
personales de contacto.

Mantener esas reglas.

### 4.2 Preservar el contexto de cada afirmación

Evitar que la extracción pierda la relación entre una tecnología y el
contexto en el que fue utilizada.

Por ejemplo, no alcanza con saber que el perfil contiene `Django` y
`PostgreSQL`. Es importante saber si aparecen: - en la sección de
habilidades; - en un empleo; - en un proyecto personal; - en educación o
formación.

No atribuir una habilidad a una experiencia laboral si el texto no
establece esa relación.

### 4.3 Identificadores estables para evidencias

Cada bullet o afirmación debería tener un identificador estable y único
dentro del perfil. Ejemplo conceptual:

``` json
{
  "id": "experience-01-bullet-03",
  "text": "Developed conversational assistants using LangChain and LangGraph.",
  "source": {
    "section": "experience",
    "entityId": "experience-01"
  }
}
```

Este ejemplo es ilustrativo; adaptar los nombres y la estructura al
esquema real.

Los IDs deben mantenerse estables mientras la afirmación siga siendo la
misma. Si se modifica sustancialmente el contenido, revisar si
corresponde generar una nueva versión o ID.

### 4.4 Instrucciones sugeridas para el prompt

``` text
Conservá la separación entre habilidades, experiencia laboral, proyectos y educación.
No conviertas una habilidad declarada en experiencia laboral.
No atribuyas una tecnología a un proyecto o empleo si el texto no establece esa relación.
Cada bullet debe representar una afirmación concreta del texto original.
No combines afirmaciones diferentes si eso puede cambiar su contexto o significado.
Preservá la relación entre cada afirmación y su sección, empleo o proyecto de origen.
```

------------------------------------------------------------------------

## 5. Etapa C: matching entre oferta y CV

Esta es la etapa que debe investigarse con mayor atención. Los problemas
observados en resultados anteriores pueden originarse en la extracción
de requisitos, en el modelo de datos, en la recuperación de evidencias o
en la evaluación final.

### 5.1 No depender de coincidencias literales

Una diferencia de vocabulario no significa necesariamente que falte una
capacidad.

Ejemplos que pueden ser equivalentes según el contexto:

  Término de la oferta   Posible expresión en el CV
  ---------------------- ---------------------------------------
  Chunking               Fragmentación de documentos
  Vector database        Base de datos vectorial
  Conversational agent   Asistente conversacional
  Document ingestion     Procesamiento e ingesta de documentos

Estas equivalencias deben validarse por contexto. No asumir que son
intercambiables en todos los casos.

Por ejemplo: - Mencionar Qdrant puede respaldar uso de una base
vectorial. - Mencionar Qdrant no demuestra automáticamente experiencia
con Pinecone. - Mencionar modelos de OpenAI no demuestra necesariamente
integración directa con OpenAI API. - Mencionar FastAPI no demuestra por
sí solo diseño de microservicios. - Mencionar Celery y Redis no
demuestra por sí solo experiencia en sistemas distribuidos. - Mencionar
webhooks no demuestra automáticamente una arquitectura event-driven.

### 5.2 Recuperación de evidencias

La búsqueda de evidencias debería considerar todas las secciones
pertinentes del CV: - skills; - experiencia; - proyectos; - educación y
certificaciones, si existen.

Sin embargo, debe conservar el tipo de fuente. No tratar una skill como
si fuera un bullet de experiencia.

La búsqueda puede combinar: - coincidencia literal; - aliases
controlados; - similitud semántica; - reglas específicas para conceptos
o tecnologías.

La similitud semántica debe proponer candidatos a evidencia, no
confirmar por sí sola que el requisito está cubierto.

### 5.3 Estados de evaluación

Revisar el estado actual de `matchResults`. Si no existen estados
equivalentes, considerar una clasificación explícita como:

-   `covered`: hay evidencia directa y suficiente.
-   `partial`: existe evidencia relacionada, pero no alcanza para
    demostrar todo el alcance del requisito.
-   `not_evidenced`: se buscó evidencia en el perfil, pero no se
    encontró respaldo suficiente.
-   `not_mentioned`: el perfil no menciona el concepto ni una
    equivalencia identificable.
-   `contradicted`: el perfil contiene información que contradice
    explícitamente el requisito, si ese caso puede determinarse.

No usar `not_evidenced` como sinónimo de que el candidato no posee la
habilidad. Solo significa que el CV no la demuestra.

No usar `contradicted` simplemente porque falta información.

### 5.4 Confidence y coverage

Si se incorporan estos indicadores, mantenerlos separados:

-   `confidence`: confianza del sistema en su evaluación.
-   `coverage`: grado en que la evidencia encontrada cubre el alcance
    del requisito.

Una coincidencia puede tener alta confianza en que existe una relación,
pero cobertura parcial del requisito.

No presentar decimales como mediciones objetivas si el sistema no tiene
una calibración que los respalde. Documentar cómo se calculan y validar
su utilidad con casos de prueba.

### 5.5 Ejemplos conceptuales

**Caso A: evidencia en experiencia**

La oferta pide experiencia con bases de datos vectoriales.

El CV contiene un bullet de experiencia que describe la implementación
de un flujo RAG con Qdrant.

Resultado esperado: `covered`, siempre que el bullet respalde el alcance
solicitado.

**Caso B: evidencia solo en Skills**

El CV enumera Qdrant en la sección de habilidades, sin describir su uso
en experiencia o proyectos.

Resultado esperado: puede existir una coincidencia de habilidad
declarada, pero no debe presentarse como experiencia laboral demostrada.
Según el requisito, podría clasificarse como `partial`.

**Caso C: tecnología relacionada, pero no equivalente**

La oferta pide experiencia con Anthropic API y el CV solo menciona
modelos de OpenAI.

Resultado esperado: no marcar Anthropic API como cubierta. La similitud
de categoría no demuestra experiencia con ese proveedor.

Estos resultados son criterios de comportamiento, no una exigencia de
copiar literalmente los valores de ejemplo si el esquema actual utiliza
otra nomenclatura.

------------------------------------------------------------------------

## 6. Etapa D: análisis de brechas

Antes de concluir que el candidato no tiene una capacidad, distinguir
entre:

1.  La capacidad no aparece en el CV.
2.  Aparece con otra terminología.
3.  Está declarada en Skills, pero no respaldada por experiencia.
4.  Hay evidencia parcial.
5.  El CV contiene evidencia directa.

Cuando exista una brecha importante y ambigua, la aplicación podría
formular una pregunta al usuario.

Ejemplo:

> La oferta solicita experiencia con testing automatizado. No
> encontramos evidencia suficiente en el CV. ¿Implementaste tests con
> Jest, Pytest u otra herramienta en alguno de tus proyectos?

La respuesta del usuario debe ser confirmada y asociada a una fuente del
perfil antes de utilizarse en una propuesta de CV. No completar
automáticamente una brecha con una suposición del modelo.

------------------------------------------------------------------------

## 7. Etapa E: adaptación del CV

### 7.1 Mantener las restricciones actuales

Conservar: - no inventar herramientas, empresas, cifras, fechas ni
logros; - mantener el idioma del perfil; - utilizar los IDs
existentes; - no agregar términos sin respaldo; - devolver una lista
vacía si no hay cambios justificados.

### 7.2 Permitir equivalencias semánticas controladas

La regla actual:

> Si un término de la oferta no aparece en el perfil, no lo uses.

Puede ser demasiado restrictiva. Reemplazarla por una regla que permita
usar términos de la oferta cuando describan la misma capacidad que ya
está respaldada por el perfil.

Instrucción sugerida:

``` text
Podés utilizar términos de la oferta cuando exista evidencia explícita de que el perfil describe esa misma capacidad.
No asumas equivalencias por similitud entre tecnologías o conceptos.
Una equivalencia semántica debe conservar el alcance de la afirmación original.
No conviertas una tecnología relacionada en experiencia directa con otra tecnología.
```

### 7.3 Evidencia directa para cada propuesta

Agregar estas restricciones:

``` text
Cada evidencia debe respaldar directamente el contenido de after.
No uses una evidencia que solamente mencione una tecnología relacionada.
Si no podés identificar evidencia suficiente para justificar el cambio, no propongas ese cambio.
No amplíes el alcance de la experiencia original.
```

### 7.4 Revisión humana

Las propuestas deben mostrarse para revisión antes de modificar el CV
original. La adaptación debe ser reversible y permitir aceptar o
rechazar cada cambio individualmente.

------------------------------------------------------------------------

## 8. Flujo recomendado

El flujo conceptual resultante sería:

``` text
JOB DESCRIPTION
      |
      v
REQUIREMENT EXTRACTION
      |
      v
STRUCTURED REQUIREMENTS
      |
      v
CV PROFILE
      |
      v
EVIDENCE RETRIEVAL
      |
      v
CANDIDATE EVIDENCE
      |
      v
SEMANTIC MATCHING
      |
      v
MATCH EVALUATION
      |
      v
GAP ANALYSIS
      |
      v
CV ADAPTATION
      |
      v
HUMAN REVIEW
```

No es obligatorio crear un servicio independiente para cada bloque. La
separación es lógica: el diseño técnico debe adaptarse a la arquitectura
existente.

------------------------------------------------------------------------

## 9. Plan de implementación por etapas

No implementar todas las recomendaciones en un único cambio.

### Fase 0 --- Auditoría

-   [ ] Localizar prompts y schemas actuales.
-   [ ] Trazar el flujo real de datos.
-   [ ] Identificar el generador de `matchResults` y `keywords`.
-   [ ] Revisar cómo se generan y relacionan los IDs de evidencias.
-   [ ] Identificar qué parte del matching es LLM y qué parte es código.
-   [ ] Crear o recopilar casos reales anonimizados para pruebas.
-   [ ] Presentar diagnóstico y plan, sin modificar código.

**Entregable:** diagnóstico del estado actual y propuesta de cambios
específicos.

### Fase 1 --- Calidad de extracción

-   [ ] Mejorar extracción de requisitos compuestos.
-   [ ] Evitar requisitos generados a partir de palabras gramaticales.
-   [ ] Revisar clasificación de prioridad.
-   [ ] Separar requisitos de keywords.
-   [ ] Validar canonical y aliases.

**Criterio de aceptación:** una oferta de prueba no debe producir
requisitos independientes a partir de verbos o palabras aisladas, y no
debe clasificar automáticamente como obligatorio todo concepto
mencionado sin contexto suficiente.

### Fase 2 --- Perfil y evidencias

-   [ ] Preservar la sección de origen de cada dato.
-   [ ] Diferenciar skills, experiencia, proyectos y educación.
-   [ ] Verificar estabilidad y unicidad de IDs.
-   [ ] Garantizar que las evidencias puedan recuperarse desde el
    perfil.

**Criterio de aceptación:** una skill no puede aparecer como evidencia
de experiencia laboral si no existe una afirmación de experiencia que la
respalde.

### Fase 3 --- Matching y evaluación

-   [ ] Revisar la lógica actual de matching.
-   [ ] Incorporar equivalencias semánticas controladas.
-   [ ] Evitar equivalencias entre tecnologías distintas.
-   [ ] Separar coincidencia literal, semántica y evidencia.
-   [ ] Definir estados de evaluación.
-   [ ] Diferenciar confidence de coverage, si corresponde.

**Criterio de aceptación:** cada requisito evaluado debe incluir
referencias a evidencias existentes o explicar que no se encontró
respaldo suficiente. Una tecnología relacionada no debe producir una
coincidencia directa falsa.

### Fase 4 --- Gap analysis y adaptación

-   [ ] Identificar brechas documentales sin afirmar que el candidato
    carece de la capacidad.
-   [ ] Permitir preguntas de aclaración al usuario cuando sean útiles.
-   [ ] Permitir equivalencias semánticas respaldadas.
-   [ ] Validar que cada propuesta tenga evidencia directa.
-   [ ] Mantener aprobación/rechazo individual de cambios.

**Criterio de aceptación:** ninguna propuesta puede introducir una
herramienta, responsabilidad, logro o nivel de experiencia que no esté
respaldado por el perfil o confirmado explícitamente por el usuario.

### Fase 5 --- Scoring y presentación

-   [ ] Revisar si el score global distingue requisitos required y
    preferred.
-   [ ] Documentar la fórmula y los pesos.
-   [ ] Mostrar cobertura y evidencia por requisito.
-   [ ] Evitar presentar un porcentaje como una predicción real de
    aprobación ATS.
-   [ ] Validar el score con un conjunto de ofertas y perfiles de
    prueba.

**Criterio de aceptación:** el resultado debe ser explicable requisito
por requisito y no depender de contar keywords sin contexto.

------------------------------------------------------------------------

## 10. Casos de prueba mínimos

Crear tests de regresión con estos escenarios:

  -----------------------------------------------------------------------
  Caso              Oferta            CV                Resultado
                                                        esperado
  ----------------- ----------------- ----------------- -----------------
  1                 PostgreSQL        PostgreSQL en     Coincidencia
                                      experiencia       respaldada.

  2                 PostgreSQL        Postgres en       Reconocer alias
                                      experiencia       equivalente.

  3                 Pinecone          Qdrant en         No afirmar
                                      experiencia       experiencia
                                                        directa con
                                                        Pinecone.

  4                 Vector database   Qdrant en         Reconocer posible
                                      experiencia       cobertura de la
                                                        categoría.

  5                 RAG / chunking    Fragmentación de  Evaluar
                                      PDFs, embeddings  equivalencia
                                      y Qdrant          según el contexto
                                                        completo.

  6                 OpenAI API        Solo menciona     No inferir
                                      modelos de OpenAI integración
                                                        directa con la
                                                        API.

  7                 Testing           No aparece en el  `not_evidenced` o
                                      CV                estado
                                                        equivalente, no
                                                        afirmar que el
                                                        candidato no sabe
                                                        testing.

  8                 Testing           Jest aparece solo Diferenciar
                                      en Skills         habilidad
                                                        declarada de
                                                        experiencia
                                                        demostrada.

  9                 Microservices     Solo aparece      No inferir
                                      FastAPI           experiencia en
                                                        microservicios.

  10                CI/CD             Aparece en        Registrar la
                                      Skills, sin       skill sin
                                      bullet de         inventar
                                      experiencia       evidencia
                                                        laboral.

  11                Requisito         La oferta lo      `preferred`.
                    deseable          marca como plus   

  12                Requisito sin     La oferta lo      `unspecified`, si
                    prioridad clara   menciona sin      el esquema lo
                                      indicar           soporta.
                                      obligatoriedad    

  13                Requisito         "Design, develop  Un requisito
                    compuesto         and maintain REST coherente, no
                                      APIs"             tres verbos
                                                        independientes.
  -----------------------------------------------------------------------

Los tests deben comprobar tanto los datos estructurados como las
evidencias y el texto final de las propuestas.

------------------------------------------------------------------------

## 11. Restricciones de implementación

-   No reescribir toda la aplicación para aplicar estas recomendaciones.
-   No cambiar contratos de API o estructuras persistidas sin
    identificar primero sus consumidores.
-   Si se modifica un schema, revisar validaciones, persistencia,
    frontend y datos históricos.
-   Mantener compatibilidad o proponer una migración explícita.
-   No agregar dependencias si la funcionalidad puede resolverse con las
    herramientas existentes.
-   No introducir una segunda fuente de verdad para el perfil del
    candidato.
-   Mantener prompts y schemas versionados cuando el proyecto ya tenga
    un mecanismo para ello; si no existe, evaluar una solución simple.
-   No modificar datos originales del CV al generar propuestas.
-   Ejecutar tests existentes y agregar tests de regresión para cada
    cambio.
-   No considerar que una respuesta válida en JSON garantiza que la
    evaluación sea correcta.

------------------------------------------------------------------------

## 12. Prompt de trabajo para iniciar en Cursor

Usar este texto en modo **Plan** o **Ask** antes de implementar:

``` text
Quiero que audites el flujo de análisis y adaptación de CV de este proyecto utilizando el documento de recomendaciones.

Primero inspeccioná el repositorio. Localizá los prompts, schemas, servicios, modelos, funciones y tests que intervienen en:
1. extracción de requisitos y keywords desde una oferta;
2. estructuración del CV;
3. recuperación y asociación de evidencias;
4. matching y generación de matchResults;
5. análisis de brechas;
6. generación de propuestas de adaptación.

Seguí el flujo real de datos y explicá qué componente produce cada resultado.

Compará la implementación actual con las recomendaciones del documento. Para cada diferencia, indicá:
- archivo y componente involucrado;
- comportamiento actual comprobado;
- problema o riesgo;
- cambio propuesto;
- impacto sobre datos, API y frontend;
- tests necesarios.

No inventes estructuras ni asumas que una recomendación ya está implementada.
No modifiques archivos durante esta primera etapa.
No propongas reemplazar componentes que ya resuelven correctamente el problema.

Al finalizar, presentá un plan de implementación ordenado por prioridad y esperá mi aprobación.
```

Una vez aprobado el diagnóstico, implementar una fase por vez. Antes de
cada fase, pedir a Cursor que indique los archivos que modificará y los
criterios de aceptación. Después, revisar el diff y ejecutar los tests.

------------------------------------------------------------------------

## 13. Resultado esperado

CV Tailor debería poder responder, para cada requisito de una oferta:

1.  ¿Qué está solicitando exactamente la empresa?
2.  ¿Qué términos permiten identificar ese requisito?
3.  ¿En qué partes del CV se encontró información relacionada?
4.  ¿Esa información es una skill declarada o una experiencia/proyecto
    documentado?
5.  ¿La evidencia cubre completamente el requisito o solo una parte?
6.  ¿Qué nivel de confianza tiene la evaluación?
7.  ¿Qué cambio en el CV puede realizarse sin exagerar ni inventar
    experiencia?

**Criterio rector:** optimizar la presentación del perfil, no alterar el
perfil para que parezca coincidir con la oferta.
