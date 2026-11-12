# ADR-005: Docker y Docker Compose para los servicios

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
La aplicación tiene varios procesos (web, api, renderer) y Chromium requiere dependencias del sistema y fuentes para que el PDF sea reproducible.

## Decisión
Los servicios se gestionan con Docker Compose: `web`, `api`, `renderer` y `db` (PostgreSQL, ver ADR-013), con volúmenes `pgdata` y `files`. Hay un `docker-compose.yml` base y un `docker-compose.dev.yml` para desarrollo. Los secretos van solo en `.env` (con `.env.example` versionado).

## Consecuencias
- Un solo comando levanta todo (`docker compose up`).
- Render de PDF reproducible entre máquinas.
- `api` depende del `healthcheck` de `db` para arrancar.
