# Informe de Auditoría: Generador de CVs para Filtros ATS e IA

**Fecha:** 16 de noviembre de 2026  
**Caso de Prueba:** Senior Full-Stack Engineer (Node.js / React / TypeScript) — *FinPulse Technologies*  
**Perfil Evaluado:** Alejandro Valdez  

---

## 1. Resumen Ejecutivo

La experiencia base del candidato es altamente competitiva y cubre tanto los requisitos centrales como los diferenciales (*Nice to Have*) de la oferta de prueba (optimización con Redis, arquitectura RAG, integraciones con OpenAI y webhooks de WhatsApp). 

Sin embargo, el **output actual generado por la aplicación fallaría en los filtros automatizados** debido a problemas de idioma, falta de coincidencia exacta de palabras clave (*exact keyword matching*), desorden en la prioridad semántica de las tecnologías y ausencia de jerarquía estructural.

---

## 2. Diagnóstico por Tipo de Filtro

### A. Filtros ATS Clásicos (Parsing y Coincidencia de Palabras Clave)

1. **Discrepancia de Idioma (Fallo Crítico):**
   * **Problema:** La oferta laboral (*Job Description*) está redactada en inglés, pero el CV se generó en español. Los motores de búsqueda de los ATS tradicionales realizan coincidencias exactas de tokens (*exact match*). Si el reclutador filtra por `"RESTful APIs"` o `"Dependency Injection"` y el documento contiene `"APIs REST"`, el sistema descarta o penaliza el perfil.
   * **Regla de negocio:** El idioma de salida del CV debe adaptarse automáticamente al idioma detectado en la oferta.

2. **Ausencia de Keywords Obligatorias (*Hard Skills*):**
   * **Problema:** La oferta exige explícitamente **TypeScript**, **Clean Architecture**, **SOLID**, **Mongoose**, **Jest/Vitest/Cypress** y **AWS**. Ninguno de estos términos aparece en el CV generado (incluso cuando TypeScript es implícito en migraciones de Angular 9–18 y proyectos en React). Para un parser, lo que no está escrito no existe.

3. **Auto-penalización de Seniority:**
   * **Problema:** El resumen profesional indica *"con casi 5 años de experiencia"*, mientras que el filtro duro de la vacante exige **5+ years**. Usar calificativos de aproximación como *"casi"* activa descartes automáticos en reglas booleanas.

4. **Solapamiento de Fechas sin Contexto:**
   * **Problema:** Las experiencias en **aZuite** (*Nov 2024 – Jul 2026*) y **Sowtic** (*Nov 2021 – Abr 2026*) se superponen durante 17 meses. Sin una etiqueta aclaratoria (ej. *Part-time*, *Contractor*, *Freelance*), los algoritmos de validación temporal pueden marcar una bandera roja por inconsistencia de datos.

---

### B. Filtros Basados en IA y Revisión Técnica (Evaluación Semántica)

1. **Dilución del Stack Principal (Falta de Re-ranking):**
   * **Problema:** El puesto busca un especialista en **Node.js, React, TypeScript y MongoDB**. Sin embargo, el primer bullet de la experiencia más reciente (*aZuite*) destaca **PHP/Laravel y Python/Django**, mientras que el stack Node/Express/MongoDB queda relegado en medio de otras experiencias. Un modelo de lenguaje (LLM) que evalúe afinidad técnica clasificará el perfil como *Desarrollador Python/PHP*, reduciendo su puntaje de encaje (*match score*).

2. **Subexposición de Diferenciales (*Nice to Have*):**
   * **Problema:** La oferta valora positivamente experiencia en **Redis**, **integraciones con OpenAI/LLMs** y **plataformas basadas en webhooks (WhatsApp Business API)**. El candidato posee experiencia comprobable en los tres puntos (*Sowtic* y *avilab.dev*), pero esta información quedó dispersa y en otro idioma, perdiendo peso frente al evaluador semántico.

3. **Formato Plano y Baja Legibilidad para Parsers:**
   * **Problema:** La falta de encabezados estándar en inglés (`EXPERIENCE`, `PROJECTS`, `SKILLS`, `EDUCATION`), enlaces explícitos (LinkedIn, GitHub, portafolio) y viñetas estructuradas bajo el formato **Acción + Contexto + Métrica** dificulta la extracción limpia de entidades.

---

## 3. Hoja de Ruta para el Motor de la Aplicación

Para garantizar que el generador supere tanto filtros léxicos (ATS) como semánticos (IA), se recomienda implementar las siguientes 4 etapas en el pipeline de generación:

### 1. Extracción y Mapeo de Entidades de la Oferta (JD Parser)
Antes de redactar el CV, el sistema debe extraer de la oferta:
* **Idioma objetivo** (`en` / `es`).
* **Lista de Must-Have Keywords** (tecnologías, patrones de arquitectura, metodologías).
* **Lista de Nice-to-Have Keywords**.
* **Años de experiencia requeridos y nivel de seniority**.

### 2. Re-ranking Semántico de Experiencias y Bullets
Calcular la similitud vectorial (embeddings) o coincidencia de tags entre cada logro del perfil base del usuario y los requisitos de la oferta:
* **Priorización:** Los bullets que contengan tecnologías del *Core Stack* de la oferta (**Node.js, React, TypeScript, MongoDB**) y los *Nice to Have* (**Redis, OpenAI, Webhooks**) deben ubicarse **al inicio** de cada bloque laboral.
* **Compresión de ruido:** Las tecnologías no solicitadas (ej. PHP, Laravel) deben agruparse o resumirse para no desviar el foco del perfil.

### 3. Reescritura Orientada a Impacto y Keywords
Instruir al modelo generador para que:
* Traduzca y adapte todo el contenido al idioma de la oferta utilizando los **sustantivos técnicos exactos** que figuran en la JD (ej. `MongoDB (Mongoose)`, `RESTful APIs`).
* Transforme verbos pasivos (*"Participé en..."*) en verbos de liderazgo técnico (*"Architected..."*, *"Engineered..."*, *"Reduced latency from 20 minutes to seconds..."*).
* Valide que las tecnologías implícitas en el historial del usuario (como **TypeScript** en proyectos Angular/React) se expliciten si la oferta las solicita y el usuario confirma dominarlas.

### 4. Taxonomía Dinámica de Habilidades (*Categorized Skills*)
Reemplazar la lista plana de tecnologías por categorías ordenadas según la relevancia para el puesto:

* **Core Stack:** JavaScript (ES6+), TypeScript, Node.js, Express.js, React, MongoDB (Mongoose).
* **Architecture & Performance:** RESTful APIs, Clean Architecture, Asynchronous Processing, Redis (Queues & Workers), Docker, CI/CD (GitHub Actions).
* **AI & Integrations:** LLM Orchestration (OpenAI, LangChain, LangGraph), RAG Architectures, Vector Databases (Qdrant), Webhooks (WhatsApp API).
* **Additional Technologies:** Python (Django, FastAPI), PostgreSQL, MySQL, Git.

### 5. Enunciado Ejemplo usado para el informe:
Senior Full-Stack Engineer (Node.js / React / TypeScript)

Company: FinPulse Technologies (Remote - LATAM / Americas)

Employment Type: Full-Time | B2B Contractor
About the Role

FinPulse is scaling its real-time B2B payment orchestration platform. We are looking for a Senior Full-Stack Engineer to own end-to-end feature delivery, architect resilient backend services, and build high-performance, responsive user interfaces. You will work directly with Product and Infrastructure teams in an agile, asynchronous-first environment.
Key Responsibilities

    Design, build, and maintain scalable RESTful APIs and event-driven microservices using Node.js, Express, and TypeScript.

    Architect and optimize complex data models and aggregation pipelines in MongoDB (Mongoose) and relational databases.

    Develop modular, accessible, and low-latency frontend applications using React, modern state management, and strict TypeScript typing.

    Enforce Clean Architecture, SOLID principles, and automated testing (unit and integration) to ensure high code maintainability and system reliability.

    Collaborate on containerized deployments using Docker and CI/CD pipelines on AWS.

    Troubleshoot production bottlenecks, optimize database query execution times, and reduce API latency under high concurrency.

Requirements & Qualifications

    5+ years of professional experience in full-stack web development.

    Deep proficiency in JavaScript (ES6+), TypeScript, Node.js, and React.

    Proven production experience with MongoDB (schema design, indexing, performance tuning).

    Strong grasp of software architecture patterns (Clean Architecture, Domain-Driven Design, Dependency Injection) and asynchronous non-blocking I/O.

    Hands-on experience with Docker, Git workflows, and automated testing frameworks (Jest, Vitest, or Cypress).

    Upper-intermediate to advanced English proficiency (B2+) for daily written and spoken collaboration with distributed teams.

Nice to Have

    Experience with message brokers (RabbitMQ, Kafka) or Redis caching.

    Familiarity with AI/LLM API integrations (OpenAI, Anthropic) or webhook-heavy platforms (WhatsApp Business API, Stripe).

    Exposure to AWS services (ECS, Lambda, S3) and Terraform.
