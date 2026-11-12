# ADR-004: Monorepo

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Con un único lenguaje (ADR-001), frontend, backend, servicio de render y paquetes comparten esquemas y tipos.

## Decisión
El proyecto es un monorepo con `apps/` (api, web, renderer) y `packages/` (domain, application, contracts, adaptadores, config). Gestor: pnpm workspaces (ADR-012). Turborepo queda como opción posterior (D26).

## Consecuencias
- Contratos compartidos entre `api` y `web` sin publicar paquetes.
- Las reglas de dependencias entre paquetes hay que verificarlas en CI (ADR-016).
- Estructura detallada en `docs/02-arquitectura.md`.
