# 05 - Roadmap

Estado: Fase 0 cerrada. Monorepo, Compose (`web`, `api`, `renderer`, `db`), validación de variables al arrancar y CI (`pnpm typecheck` y `pnpm boundaries` con `dependency-cruiser`). LangSmith queda cableado solo por variables de entorno; la primera traza saldrá con el primer grafo (ADR-007). D12 (ADR-018) y D16 (ADR-019) están resueltas. Siguiente: Fase 1; D15 antes de `ImportProfileFromPdf`. Ver `README.md`.

- **Fase 0 - Esqueleto** (hecha): monorepo (pnpm workspaces), Docker Compose (`web`, `api`, `renderer`, `db` con PostgreSQL), variables de entorno (`LLM_PROVIDER`, `OPENAI_API_KEY`, `DATABASE_URL`, LangSmith) y CI con `dependency-cruiser`. Las trazas de LangSmith se activan solo con variables de entorno; la primera sale con el primer grafo.
- **Fase 1 - Dominio y perfil maestro**: entidades de dominio, `ImportProfileFromPdf`, adaptadores de lectura de PDF y extracción con LangGraph, pantalla de corrección del perfil.
- **Fase 2 - Oferta y matching**: `AnalyzeJobPosting`, normalización de keywords, matching con evidencia y reporte de brechas.
- **Fase 3 - Sugerencias y revisión**: `GenerateTailoringProposal`, fabrication guard, `ReviewSuggestion` (aceptar, editar, rechazar).
- **Fase 4 - Render y exportación**: plantilla HTML A4, vista previa en vivo, servicio `renderer`, `ExportTailoredCv`.
- **Fase 5 - Pulido**: pruebas e2e, manejo de errores, documentación de uso.

La Fase 0 no dejó decisiones abiertas. Ya resueltas: D11 (OpenAI), D12 (política anti-invención, ADR-018), D16 (privacidad, ADR-019), D20 (pnpm), D21 (Postgres), D22 (renderer separado), D23 (revisión humana), D24 (verificación de límites) y D25 (proxy con `rewrites`). Antes de `ImportProfileFromPdf` conviene resolver D15 (entrada del PDF).
