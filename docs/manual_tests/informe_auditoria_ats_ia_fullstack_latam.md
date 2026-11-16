# Informe de Auditoría: Generador de CVs para Filtros ATS e IA

**Fecha:** 16 de noviembre de 2026
**Caso de Prueba:** Desarrollador/a Full Stack Semi Senior/Senior — *oferta genérica remoto LATAM* (ver Anexo)
**Perfil Evaluado:** Alejandro (CV pegado en esta sesión, ver Anexo)

---

## 1. Resumen Ejecutivo

A diferencia del caso FinPulse (`informe_de_auditor_a_ats_e_ia_generador_de_cvs.md`), esta oferta está redactada en español, por lo que **no hay penalización por idioma**. Sin embargo, el CV evaluado presenta **vacíos de keywords duras explícitas en la oferta** (TypeScript, testing automatizado, arquitectura/SOLID, Next.js), **ausencia de enlaces de contacto** (GitHub/portfolio, pedidos explícitamente en la oferta) y **un defecto de encabezado** (el nombre aparece incompleto). A su vez, el perfil cubre muy bien varios de los diferenciales (*Nice to Have*): LangChain, LangGraph, LLMs, Redis.

**Hallazgo transversal relevante:** el texto de este CV es, en su estructura, orden de bullets y redacción, prácticamente idéntico al evaluado en el informe anterior para una oferta completamente distinta (en inglés, con otro stack prioritario). Esto sugiere que el contenido no fue reordenado/adaptado de forma específica a la nueva oferta — ya sea porque el usuario pegó el mismo perfil maestro sin pasarlo por el flujo de tailoring de la app, o porque el motor de generación todavía no aplica el re-ranking y la selección de keywords descriptos en el informe anterior. Conviene confirmar con el usuario si este texto es la salida real del pipeline de `propose-tailoring` para esta oferta puntual, o el perfil base sin adaptar, antes de tratar los puntos de esta sección como defectos del motor.

---

## 2. Diagnóstico por Tipo de Filtro

### A. Filtros ATS Clásicos (Parsing y Coincidencia de Palabras Clave)

1. **Encabezado de nombre incompleto (hallazgo nuevo, potencialmente crítico):**
   * **Problema:** El documento pegado comienza con `ALEJANDRO` como único dato de nombre, sin apellido (`2364526844 ale1988valdez@gmail.com` / `La Plata` en las líneas siguientes). Los ATS suelen parsear la primera línea como "Nombre completo" para crear el registro del candidato; si falta el apellido, el perfil puede cargarse incompleto o generar un error de validación en el sistema de reclutamiento.
   * **Acción sugerida:** verificar si el renderer/generador está truncando el apellido en el encabezado, o si fue un recorte al pegar el texto en esta conversación.

2. **Ausencia de enlaces de contacto pedidos explícitamente por la oferta:**
   * **Problema:** La sección "Cómo aplicar" de la oferta pide "incluyendo enlace a GitHub/portfolio". El CV no incluye LinkedIn, GitHub ni un link de portfolio (solo nombra `picado.app` y `avilab.dev` como texto, sin URL ni repositorio). Un ATS que valide la presencia de estos campos, o un reclutador que busque validar el trabajo mostrado, no tiene forma directa de verificarlo.

3. **Ausencia total de la keyword "TypeScript" (requisito excluyente):**
   * **Problema:** La oferta pide explícitamente "Sólidos conocimientos de JavaScript y TypeScript" como excluyente. El CV menciona JavaScript pero TypeScript no aparece ni una vez, ni en el perfil, ni en habilidades técnicas, pese a que el perfil incluye migraciones de Angular (9 a 18) donde TypeScript típicamente es la base. Para un parser por keywords, esto es un filtro duro fallido.

4. **Ausencia de keywords de testing automatizado (requisito excluyente):**
   * **Problema:** La oferta exige "experiencia escribiendo tests unitarios y de integración (Jest, Vitest, Testing Library)". Ninguno de estos términos, ni "test", ni "testing", ni "QA", aparece en el documento. Es otro filtro duro con coincidencia cero.

5. **Ausencia de keywords de arquitectura/patrones (requisito excluyente):**
   * **Problema:** La oferta pide "patrones de diseño, arquitectura hexagonal o por capas, principios SOLID". El CV no menciona ninguno de estos términos de forma explícita, pese a que el candidato trabaja activamente en un proyecto propio (este mismo repositorio) con arquitectura hexagonal documentada.

6. **Ausencia de "Next.js" y de ORMs nombrados en la oferta (Prisma, TypeORM, Sequelize):**
   * **Problema:** La oferta pide React **con Next.js** y ORMs específicos. El CV menciona React sin Next.js, y no nombra ningún ORM (ni siquiera el ORM de Django, que sí usa). Coincidencia parcial en React, nula en Next.js y en ORMs nombrados.

7. **Ausencia de nivel de inglés declarado:**
   * **Problema:** La oferta pide "Inglés técnico" como excluyente. El CV no incluye ninguna mención de idiomas.

8. **Solapamiento de fechas sin aclaración (recurrente del caso anterior):**
   * **Problema:** aZuite (nov. 2024 – jul. 2026) y Sowtic (nov. 2021 – abr. 2026) se solapan ~17 meses sin etiqueta de modalidad (medio tiempo, freelance, consultoría paralela). Mismo hallazgo que en el informe FinPulse; sigue sin resolverse en el perfil maestro o en la capa de presentación del CV.

### B. Filtros Basados en IA y Revisión Técnica (Evaluación Semántica)

1. **Dilución del stack principal pedido por la oferta:**
   * **Problema:** La oferta prioriza React + Next.js + Node.js + PostgreSQL/MySQL + TypeScript. El primer bullet de la experiencia más reciente (aZuite) vuelve a liderar con **PHP/Laravel y Python/Django**, igual que en el caso FinPulse. Un evaluador semántico puede seguir clasificando el perfil como "backend PHP/Python" antes que "Full Stack JS/TS", que es el encuadre que esta oferta busca.

2. **Buena cobertura de los diferenciales de IA (punto fuerte):**
   * **Fortaleza:** La oferta lista como deseable explícito "Conocimientos de LangChain, LangGraph o integración con LLMs (OpenAI, Anthropic)". El perfil cubre esto con evidencia concreta y verificable (chatbots con LangChain/LangGraph, modelos de OpenAI/Groq/Ollama, sistema RAG con Qdrant, proyecto `avilab.dev`). Es el área de mayor fortaleza competitiva del CV para esta oferta puntual y conviene que quede más visible, no diluida en el medio del bloque de Sowtic.

3. **Match parcial en "colas/mensajería asíncrona":**
   * **Observación:** La oferta valora "sistemas de colas/mensajería (RabbitMQ, SQS) o procesamiento asíncrono". El CV menciona colas de Redis (aZuite) y Celery+Redis (avilab.dev), que es procesamiento asíncrono real aunque con tecnología distinta a la nombrada en la oferta. Un evaluador semántico probablemente lo valore como match parcial; un ATS por keyword exacto ("RabbitMQ", "SQS") no lo detecta.

4. **Sin evidencia de dominio fintech/SaaS B2B:**
   * **Observación:** La oferta valora experiencia previa en "productos fintech, SaaS B2B o plataformas de alto tráfico" como deseable. Los proyectos mostrados (pronósticos deportivos, ensayos agrícolas, gestión de turnos, CRM interno) no encajan en ese dominio. No es un defecto del CV — no hay por qué inventar experiencia fintech — pero es un punto que un evaluador de IA puede descontar al calcular afinidad de dominio.

5. **Calificador de experiencia ("casi 5 años") ya no es un riesgo crítico en este caso:**
   * **Observación:** A diferencia del caso FinPulse (que pedía 5+ años), esta oferta pide 3+ años, por lo que "casi 5 años" queda cómodamente por encima del umbral. Sigue siendo una redacción débil frente a un filtro booleano estricto, pero deja de ser un punto crítico específico de esta oferta.

---

## 3. Comparación con el caso anterior (FinPulse)

| Punto | Caso FinPulse (inglés) | Caso Full Stack LATAM (español) |
|---|---|---|
| Idioma CV vs. oferta | Desajuste crítico (CV en ES, oferta en EN) | Sin desajuste (ambos en ES) |
| TypeScript explícito | Ausente (exigido) | Ausente (exigido) |
| Testing automatizado | No evaluado explícitamente en ese informe | Ausente (exigido: Jest/Vitest/Testing Library) |
| Arquitectura/SOLID | No evaluado explícitamente en ese informe | Ausente (exigido) |
| Orden de bullets (stack principal vs. PHP/Django) | PHP/Django primero, diluye stack pedido | Mismo patrón: PHP/Django primero |
| Diferenciales de IA (LangChain/LangGraph/RAG) | Cubiertos pero diluidos | Cubiertos pero diluidos |
| Solapamiento de fechas | Presente, sin aclarar | Presente, sin aclarar |

La recurrencia de los mismos patrones (orden de bullets, solapamiento de fechas, dilución de diferenciales) en dos ofertas distintas refuerza que son problemas del **perfil maestro o de la etapa de estructuración del CV**, no de una oferta puntual.

---

## 4. Recomendaciones priorizadas para este caso

1. **Confirmar el origen de este texto**: si es salida real de `propose-tailoring`/`extract-profile` para esta oferta, hay que revisar por qué no se reordenan los bullets ni se resaltan las keywords exactas de la oferta (ver roadmap del informe FinPulse, secciones 2 a 4, que sigue aplicando sin cambios).
2. **Corregir el encabezado de nombre** si el recorte a "ALEJANDRO" viene del propio sistema (renderer o estructuración del CV), no de un error al pegar el texto.
3. **Revisar si el perfil maestro tiene registrado TypeScript, testing (Jest/Vitest/Cypress/Playwright) y conceptos de arquitectura (SOLID, hexagonal)** como evidencia verificable. Si el candidato efectivamente los práctica (por ejemplo, TypeScript en las migraciones de Angular, o arquitectura hexagonal en este mismo repositorio), conviene agregarlos al perfil maestro con su evidencia asociada, para que el fabrication guard pueda citarlos legítimamente en futuras generaciones. Si no están en el perfil maestro, el comportamiento actual (no mencionarlos) es correcto según la regla de no inventar experiencia.
4. **Agregar campo de enlaces** (GitHub, LinkedIn, portfolio) al perfil maestro y a la estructura de salida del CV, dado que varias ofertas los piden explícitamente para aplicar.
5. **Mantener visibles los diferenciales de IA** (LangChain, LangGraph, RAG, Qdrant) cerca del inicio del CV cuando la oferta los valora, en lugar de dejarlos en medio del bloque de experiencia de Sowtic.

---

## Anexo A — Oferta utilizada en este caso

```text
Desarrollador/a Full Stack Semi Senior / Senior

Sobre la empresa
Somos una scale-up de software que desarrolla productos SaaS B2B para el sector fintech, con más de 80 personas distribuidas en Latinoamérica y España. Buscamos sumar a una persona Desarrolladora Full Stack para integrarse a un equipo multidisciplinario que trabaja bajo metodologías ágiles (Scrum) en ciclos de dos semanas.

Modalidad: Remoto (LATAM), con disponibilidad horaria superposición parcial con horario Argentina (GMT-3).
Tipo de contrato: Full-time, relación de dependencia o monotributo/freelance.
Seniority: Semi Senior / Senior (3 a 6 años de experiencia).

Responsabilidades principales
- Diseñar, desarrollar y mantener funcionalidades end-to-end, desde la base de datos hasta la interfaz de usuario.
- Participar en el diseño de arquitectura de software, priorizando buenas prácticas, escalabilidad y mantenibilidad.
- Escribir código limpio, testeado y documentado, siguiendo principios SOLID y arquitectura hexagonal/clean architecture.
- Diseñar e implementar APIs RESTful y, en algunos casos, GraphQL.
- Colaborar con diseño UX/UI para implementar interfaces responsive y accesibles.
- Participar en code reviews, pair programming y en la definición de estándares técnicos del equipo.
- Trabajar con integraciones de terceros (pasarelas de pago, proveedores de identidad, servicios de IA/LLM).
- Colaborar en la definición de pipelines de CI/CD y en la mejora continua del proceso de despliegue.
- Participar en ceremonias ágiles: daily standup, sprint planning, retrospectivas y refinamiento de backlog.

Requisitos excluyentes
- 3+ años de experiencia profesional en desarrollo de software.
- Sólidos conocimientos de JavaScript y TypeScript.
- Experiencia con React (hooks, context, manejo de estado) y Next.js.
- Experiencia en backend con Node.js (Express o NestJS).
- Experiencia con bases de datos relacionales (PostgreSQL o MySQL) y ORMs (Prisma, TypeORM o Sequelize).
- Manejo de Git y flujos de trabajo colaborativos (GitHub/GitLab, pull requests, trunk-based o git-flow).
- Experiencia escribiendo tests unitarios y de integración (Jest, Vitest, Testing Library).
- Conocimientos de arquitectura de software: patrones de diseño, arquitectura hexagonal o por capas, principios SOLID.
- Experiencia con Docker y contenedores para entornos de desarrollo y despliegue.
- Inglés técnico (lectura de documentación, interacción ocasional con stakeholders internacionales).

Requisitos deseables (no excluyentes)
- Experiencia con TypeScript en monorepos (pnpm workspaces, Turborepo o Nx).
- Conocimientos de LangChain, LangGraph o integración con LLMs (OpenAI, Anthropic) en productos reales.
- Experiencia con pruebas end-to-end (Playwright o Cypress).
- Conocimientos de infraestructura cloud (AWS, GCP o Azure) y despliegue mediante contenedores (Docker Compose, Kubernetes).
- Experiencia con sistemas de colas/mensajería (RabbitMQ, SQS) o procesamiento asíncrono.
- Conocimientos de seguridad de aplicaciones web (OWASP Top 10, autenticación OAuth2/JWT).
- Experiencia previa en productos fintech, SaaS B2B o plataformas de alto tráfico.
- Certificaciones en cloud (AWS Certified Developer, GCP Professional) son un plus.

Habilidades blandas
- Autonomía y capacidad de resolución de problemas sin supervisión constante.
- Buena comunicación escrita y oral, tanto en español como en inglés.
- Capacidad de trabajo en equipo y de dar/recibir feedback técnico de forma constructiva.
- Orientación a resultados y atención al detalle.
- Mentalidad de mejora continua y apertura a aprender nuevas tecnologías.

Se ofrece
- Salario competitivo acorde a mercado y experiencia, en USD.
- Modalidad 100% remota con horarios flexibles.
- Presupuesto anual para capacitación, cursos y certificaciones.
- Equipamiento (notebook) provisto por la empresa.
- Día libre por cumpleaños y esquema de vacaciones extendido.
- Posibilidad real de crecimiento hacia roles de Tech Lead o Arquitectura de Software.

Cómo aplicar
Enviar CV actualizado en formato PDF a rrhh@empresa-ejemplo.com indicando en el asunto "Full Stack Developer - [Tu Nombre]", incluyendo enlace a GitHub/portfolio y pretensión salarial.
```

## Anexo B — CV evaluado en este caso

```text
ALEJANDRO
2364526844 ale1988valdez@gmail.com
La Plata
PERFIL PROFESIONAL
Desarrollador Full Stack con casi 5 años de experiencia profesional en el desarrollo de aplicaciones web,
tanto en frontend como en backend. Experiencia con React, Node.js, Python, Django, FastAPI, Angular,
Laravel, APIs REST y bases de datos relacionales y no relacionales.
He participado en el desarrollo de aplicaciones desde el análisis de requerimientos hasta el despliegue,
incluyendo integraciones con servicios externos y optimización de procesos. Además, cuento con
experiencia práctica en integración de inteligencia artificial, desarrollo de chatbots, orquestación de LLM y
sistemas RAG con Qdrant.
EXPERIENCIA PROFESIONAL
Desarrollador Full Stack | aZuite
Noviembre 2024 – Julio 2026 · Junín
Participé en el desarrollo y mantenimiento de aplicaciones web con PHP/Laravel y Python/Django,
trabajando en frontend y backend, análisis de requerimientos, decisiones técnicas y despliegues.
Optimización de rendimiento: reduje el cálculo de puntos de unos 20 minutos a segundos con workers
independientes por tenant y colas de Redis separadas.
Picado.app: construí desde cero una aplicación de pronósticos de partidos para competencias como el
Mundial de Fútbol, con React, Django y PostgreSQL, desde el análisis de requerimientos hasta la
implementación (picado.app).
Plataforma de ensayos de siembra: desarrollé nuevas funcionalidades y mantuve una aplicación de
registro de ensayos agrícolas hecha con PHP y Laravel.
Infraestructura: administré bases de datos MySQL y PostgreSQL y configuré entornos de despliegue
con Docker y Docker Compose.
Decisiones técnicas: propuse funcionalidades y soluciones técnicas, y coordiné directamente con el
cliente.
Desarrollador Full Stack | Sowtic
Noviembre 2021 – Abril 2026 · La Plata
Participé en múltiples proyectos de desarrollo de software, trabajando en frontend, backend, integración
de servicios externos y desarrollo de soluciones basadas en inteligencia artificial.
Desarrollo Full Stack e integraciones: desarrollé aplicaciones con React, Django, Node.js, Express.js y
MongoDB, e integré servicios externos.
Migración de arquitectura Angular: actualicé el core interno de Angular de la versión 9 a la 18. Es la
base de más de 20 proyectos, junto con una biblioteca compartida de componentes y servicios distribuida
por npm.
Chatbots con IA: desarrollé asistentes conversacionales con Python, LangChain y LangGraph, usando
modelos de OpenAI, Groq y Ollama, con flujos de orquestación que eligen la herramienta adecuada
según cada consulta.
Asistente de WhatsApp integrado a un CRM: construí un asistente que interpreta mensajes de texto y
audio (Whisper) y gestiona pedidos y solicitudes por conversación, conectado al CRM mediante
webhooks. Así se automatizó la atención que antes se hacía a mano.
Sistemas RAG: implementé un pipeline de procesamiento de documentos PDF (fragmentación,
embeddings, almacenamiento vectorial en Qdrant) para generar respuestas basadas en documentación
propia.
Análisis de requerimientos: participé en entrevistas con usuarios y en la definición de funcionalidades
para plataformas de gestión.
PROYECTOS DESTACADOS
avilab.dev | Plataforma de gestión de turnos con IA
Proyecto personal en desarrollo · avilab.dev
Plataforma de turnos con un agente conversacional en WhatsApp que interpreta solicitudes y ejecuta
operaciones sobre la agenda.
Backend y frontend: React y Django, con procesamiento asíncrono en Celery y Redis para enviar
emails y reasignar turnos.
Orquestador de LLM: servicio en FastAPI que interpreta los mensajes de WhatsApp y coordina las
acciones para responder cada solicitud.
Servidor MCP: implementado en FastAPI. Lee la especificación OpenAPI del backend y expone sus
endpoints como herramientas para el agente.
Tecnologías: React, Django, FastAPI, Python, Celery, Redis, LLM, MCP y OpenAPI.
HABILIDADES TÉCNICAS
JavaScript, React, Node.js, Express.js, PostgreSQL, MySQL, desarrollo de APIs REST, Git, Git Flow,
Docker, Docker Compose, CI/CD con GitHub Actions y Bitbucket Pipelines, Angular, HTML5, CSS3, Python,
Django, FastAPI, PHP, Laravel, MongoDB, Redis, integración de LLM, LangChain, LangGraph, arquitecturas
RAG, embeddings, Qdrant, asistentes conversacionales.
EDUCACIÓN
Analista Programador Universitario
Universidad Nacional de La Plata | Marzo 2017 – Febrero 2023
```
