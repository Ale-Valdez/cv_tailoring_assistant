# 05 - Roadmap

Estado: Fase 3 hecha. Se puede proponer cambios sobre el perfil confirmado, verlos y aceptarlos, editarlos o rechazarlos. El fabrication guard descarta lo que el perfil no respalda. Siguiente: Fase 4. La Fase 0 dejó el monorepo, Compose (`web`, `api`, `renderer`, `db`), la validación de variables al arrancar y el CI (`pnpm typecheck`, `pnpm test` y `pnpm boundaries`). LangSmith queda cableado solo por variables de entorno y traza los grafos de `adapter-ai` si `LANGSMITH_TRACING=true` (ADR-007). D12 (ADR-018), D14 (ADR-022), D15 (ADR-020), D16 (ADR-019) y D18 (ADR-021) están resueltas. D13, D17 y D19 siguen abiertas para la Fase 4. Ver `README.md`.

- **Fase 0 - Esqueleto** (hecha): monorepo (pnpm workspaces), Docker Compose (`web`, `api`, `renderer`, `db` con PostgreSQL), variables de entorno (`LLM_PROVIDER`, `OPENAI_API_KEY`, `DATABASE_URL`, LangSmith) y CI con `dependency-cruiser`. Las trazas de LangSmith se activan solo con variables de entorno; la primera sale con el primer grafo.
- **Fase 1 - Dominio y perfil maestro** (hecha): entidades de dominio, `ImportProfileFromPdf`, el lector de PDF (`unpdf`), el extractor con LangGraph, la pantalla de corrección, los endpoints y la persistencia del perfil confirmado.
- **Fase 2 - Oferta y matching** (hecha): `AnalyzeJobPosting`, normalización de keywords, matching con evidencia y reporte de brechas. La oferta se pega como texto (ADR-021) y queda en PostgreSQL. El informe se calcula al leer y no traduce (ADR-022).
- **Fase 3 - Sugerencias y revisión** (hecha): `GenerateTailoringProposal`, fabrication guard, `ReviewSuggestion` (aceptar, editar, rechazar). La propuesta queda en PostgreSQL.
- **Fase 4 - Render y exportación**: plantilla HTML A4, vista previa en vivo, servicio `renderer`, `ExportTailoredCv`.
- **Fase 5 - Pulido**: pruebas e2e, manejo de errores, documentación de uso.

La Fase 0 no dejó decisiones abiertas. Ya resueltas: D11 (OpenAI), D12 (política anti-invención, ADR-018), D14 (idioma, ADR-022), D15 (entrada del PDF, ADR-020), D16 (privacidad, ADR-019), D18 (entrada de la oferta, ADR-021), D20 (pnpm), D21 (Postgres), D22 (renderer separado), D23 (revisión humana), D24 (verificación de límites) y D25 (proxy con `rewrites`).
