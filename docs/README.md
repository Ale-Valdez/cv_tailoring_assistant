# CV Tailor - Documentación

Herramienta para adaptar un CV (PDF) a una oferta laboral sin inventar experiencia: analiza la oferta, compara con la experiencia real, detecta keywords ATS, propone cambios revisables y exporta un PDF generado desde HTML.

## Estado actual (dónde quedamos)

- Fecha de última actualización: 2026-11-12
- Fase: **Fase 0 cerrada** (esqueleto).
- Hecho: monorepo pnpm (Node `24.19.0`, pnpm `12.18.0`) y Docker Compose con `web`, `api`, `renderer` y `db` (PostgreSQL 18, volumen `pgdata`). `api` y `renderer` responden `GET /health`. `web` reenvía `/api/*` a `api` y muestra si la API responde. `api` no publica puertos; en desarrollo el override sí. `api` sale al arrancar si faltan `LLM_PROVIDER` (`openai`), `LLM_MODEL`, `OPENAI_API_KEY` o `DATABASE_URL`. Con `LANGSMITH_TRACING=true` también exige `LANGSMITH_API_KEY` y `LANGSMITH_PROJECT`. No hay código de trazas: las variables llegan al proceso para cuando exista el primer grafo (ADR-007). El volumen `files` está montado en `/data/files` (`FILES_DIR`); todavía no hay `FileStorage` ni esquema de Prisma. El CI (`.github/workflows/ci.yml`) ejecuta `pnpm typecheck` y `pnpm boundaries`. Los límites hexagonales los comprueba `dependency-cruiser` con parser `swc` (`.dependency-cruiser.cjs`, ADR-016): la versión 18 no lee TypeScript 7. `pnpm boundaries` falla si el parser no pudo leer los fuentes. `packages/config` queda para cuando haya ESLint compartido.
- Hecho antes del código: análisis, MVP, riesgos, arquitectura, modelo de dominio y decisiones D1 a D10, más D11 (OpenAI), D12 (política anti-invención), D16 (privacidad), D20 (pnpm), D21 (Postgres), D22 (renderer separado), D23 (revisión humana en la aplicación), D24 (verificación de límites) y D25 (proxy web a api con `rewrites`).
- Siguiente: Fase 1 (dominio y perfil maestro). D15 (entrada del PDF) antes de `ImportProfileFromPdf`. El identificador de `LLM_MODEL` se elige al conectar el LLM.
- Arranque: copiar `.env.example` a `.env` y completar `LLM_MODEL` y `OPENAI_API_KEY`. Luego `pnpm compose` (`docker compose up --build`). Desarrollo con recarga: `pnpm install` y `pnpm compose:dev`. `pnpm dev` sigue sirviendo las apps en el host (lee `.env`). `pnpm check` ejecuta el typecheck y la verificación de límites.

## Resumen de la arquitectura

Monorepo TypeScript (pnpm workspaces) con arquitectura hexagonal. Backend Express (`apps/api`), frontend Next.js solo UI (`apps/web`), servicio `renderer` con Playwright y base PostgreSQL, todo con Docker Compose. LangChain y LangGraph orquestan los LLM dentro del adaptador de IA; el proveedor es OpenAI y se cambia desde el `.env` mediante una fábrica de modelos. LangSmith se activa solo con variables de entorno. Un solo usuario local, sin login.

## Índice

- [01-analisis.md](01-analisis.md): problema, usuarios, casos de uso, MVP y fuera de alcance.
- [02-arquitectura.md](02-arquitectura.md): hexagonal, servicios, LangGraph, LangSmith, stack, estructura del monorepo.
- [03-modelo-de-dominio.md](03-modelo-de-dominio.md): entidades, relaciones e invariantes.
- [04-riesgos.md](04-riesgos.md): riesgos técnicos y mitigaciones.
- [05-roadmap.md](05-roadmap.md): fases propuestas.
- [decisions/](decisions/): registro de decisiones.
  - Aceptadas: [ADR-001](decisions/ADR-001-typescript-unico-lenguaje.md) TypeScript, [ADR-002](decisions/ADR-002-llm-en-la-nube.md) LLM en la nube, [ADR-003](decisions/ADR-003-un-usuario-local.md) un usuario local, [ADR-004](decisions/ADR-004-monorepo.md) monorepo, [ADR-005](decisions/ADR-005-docker-compose.md) Docker Compose, [ADR-006](decisions/ADR-006-langchain-langgraph.md) LangChain y LangGraph, [ADR-007](decisions/ADR-007-langsmith-solo-monitoreo.md) LangSmith solo monitoreo, [ADR-008](decisions/ADR-008-backend-express.md) Express, [ADR-009](decisions/ADR-009-arquitectura-hexagonal.md) hexagonal, [ADR-010](decisions/ADR-010-nextjs-solo-ui.md) Next.js solo UI, [ADR-011](decisions/ADR-011-openai-con-fabrica-de-modelos.md) OpenAI con fábrica de modelos, [ADR-012](decisions/ADR-012-pnpm-workspaces.md) pnpm workspaces, [ADR-013](decisions/ADR-013-postgres.md) PostgreSQL, [ADR-014](decisions/ADR-014-renderer-servicio-separado.md) renderer separado, [ADR-015](decisions/ADR-015-revision-humana-en-aplicacion.md) revisión humana en la aplicación, [ADR-016](decisions/ADR-016-verificacion-de-limites-hexagonales.md) verificación de límites hexagonales, [ADR-017](decisions/ADR-017-proxy-web-a-api-con-rewrites.md) proxy web a api con `rewrites`, [ADR-018](decisions/ADR-018-politica-anti-invencion.md) política anti-invención, [ADR-019](decisions/ADR-019-privacidad-cv-llm-langsmith.md) privacidad del CV.
  - Pendientes: [pendientes.md](decisions/pendientes.md) (D13 a D15, D17 a D19, D26).

## Cómo mantener esta documentación

- Al tomar una decisión: crear un ADR nuevo, actualizar `pendientes.md` y la sección "Estado actual" de este archivo.
- Al terminar una fase: actualizar `05-roadmap.md` y este archivo.
- Si el código y la documentación difieren, corregir la documentación en el mismo cambio.
