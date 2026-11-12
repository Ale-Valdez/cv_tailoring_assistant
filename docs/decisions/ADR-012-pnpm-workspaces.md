# ADR-012: pnpm workspaces como gestor del monorepo

- Estado: Aceptada (resuelve D20, parcialmente)
- Fecha: 2026-11-12

## Contexto
La propuesta original era pnpm workspaces y Turborepo. Se confirmó solo pnpm.

## Decisión
- El monorepo usa pnpm workspaces (`pnpm-workspace.yaml`), con dependencias internas por `workspace:*`.
- Los scripts compartidos se ejecutan con `pnpm -r` y filtros (`pnpm --filter`).
- Turborepo no se adopta por ahora. Queda como decisión opcional D26 para cuando los tiempos de build o test lo justifiquen.
- Versión de Node fijada en `.nvmrc` y en las imágenes Docker; versión de pnpm fijada con `packageManager` en el `package.json` raíz y activada con Corepack.

## Consecuencias
- Menos herramientas en la Fase 0.
- Sin caché de tareas ni orden de build automático entre paquetes: el orden se resuelve con `pnpm -r` (que respeta el grafo de dependencias de los workspaces).
- Agregar Turborepo después es aditivo (un `turbo.json` y scripts), sin reestructurar.
