# ADR-008: Backend Express como API separada

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Alternativas: route handlers de Next.js, Fastify o NestJS. Con arquitectura hexagonal (ADR-009), el backend debe ser un adaptador de entrada delgado, y no un framework que imponga su estructura.

## Decisión
El backend es una API REST con Express 5 y TypeScript, en `apps/api`. Valida con Zod en el borde HTTP y usa pino para logs. `apps/api` es también la raíz de composición (inyección de dependencias manual).

## Consecuencias
- Frontend y backend se despliegan y evolucionan por separado.
- Se evita un contenedor DI de framework; el cableado es explícito.
- Hay que resolver la conexión `web` a `api` (resuelto en ADR-017: `rewrites` de Next.js).
