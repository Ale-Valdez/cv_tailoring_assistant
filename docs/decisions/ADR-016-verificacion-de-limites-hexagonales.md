# ADR-016: Verificación automática de límites hexagonales en CI

- Estado: Aceptada (resuelve D24)
- Fecha: 2026-11-12

## Contexto
Con el tiempo es fácil que el núcleo importe, por conveniencia, Express, Prisma, LangChain u otro adaptador, y la arquitectura hexagonal se erosione sin que nadie lo note.

## Decisión
Se usa `dependency-cruiser`. Al implementar la Fase 0 se confirmó esta herramienta; la alternativa evaluada fue `eslint-plugin-boundaries`.

La configuración está en `.dependency-cruiser.cjs`. El parser es `swc` (`@swc/core`): dependency-cruiser 18 todavía no lee TypeScript 7, y `swc` sí ve los `import` y los `import type`. `pnpm-workspace.yaml` permite el postinstall de `@swc/core` y de Prisma (`allowBuilds`). `pnpm boundaries` (`scripts/boundaries.mjs`) y el CI (`.github/workflows/ci.yml`, que también ejecuta `pnpm typecheck` y `pnpm test`) fallan si hay una violación o si el parser no pudo leer TypeScript. Los `*.test.ts` y `vitest.config.ts` quedan fuera del análisis: importan Vitest, que no es una dependencia de producción.

- `domain` no importa nada del monorepo ni librerías externas, salvo Zod.
- `application` solo importa `domain`.
- `contracts` solo importa `domain` (o nada del monorepo) y Zod.
- Ningún `adapter-*` importa otro `adapter-*`, ni `contracts`, ni `apps/*`.
- `apps/web` solo importa `contracts` del monorepo.
- `apps/renderer` no importa paquetes del monorepo.
- `apps/api` importa `application`, `contracts` y los adaptadores. No importa `domain`, `web` ni `renderer`.
- Express solo se importa desde `apps/api`. Prisma solo desde `adapter-persistence`. LangChain, LangGraph y el paquete `openai` solo desde `adapter-ai`. Playwright solo desde `apps/renderer`.
- Ningún paquete interno importa de `apps/*`.

`packages/config` no forma parte de este paso: no hay ESLint compartido. El tsconfig base sigue en la raíz.

## Consecuencias
- Las violaciones se detectan en el mismo cambio que las introduce.
- `.dependency-cruiser.cjs` debe reflejar las reglas de `docs/02-arquitectura.md`.
