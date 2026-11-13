# ADR-013: PostgreSQL como base de datos

- Estado: Aceptada (resuelve D21)
- Fecha: 2026-11-12

## Contexto
La propuesta original era SQLite en un volumen para el MVP, con Postgres como migración futura. Se decidió usar Postgres desde el inicio.

## Decisión
- La persistencia usa PostgreSQL, como servicio `db` en Docker Compose, con un volumen nombrado `pgdata`.
- Acceso mediante Prisma, en `adapter-persistence`, que implementa los puertos de repositorio.
- Los archivos subidos (PDF originales) y exportados (PDF generados) se guardan detrás del puerto `FileStorage`, en un volumen `files` montado en `api`.
- Variables de entorno previstas: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
- `api` espera al `healthcheck` de `db` antes de arrancar y ejecuta las migraciones de Prisma como paso explícito (no automático en cada arranque en producción local).

## Consecuencias
- Un servicio más en Compose, pero sin migración futura desde SQLite.
- Los campos semiestructurados (por ejemplo el snapshot del contenido del CV) pueden usar `jsonb`.
- Al no haber checkpointer de LangGraph (ADR-006, ADR-015), Postgres solo guarda el estado de dominio.

## Actualización (2026-11-13)

El perfil confirmado es una fila en `Profile`: `id`, `updatedAt` y `document` (`jsonb` con el agregado). La oferta analizada es una fila en `JobPosting`: `id`, `contentHash` (único), `updatedAt` y `document`. El dominio valida esos documentos al guardarlos y al leerlos. `pnpm db:migrate` aplica las migraciones; `api` no las corre al arrancar. `FileStorage` escribe los PDF exportados bajo `FILES_DIR`. En Compose ese directorio es `/data/files`, el volumen `files`. El PDF de la importación no se guarda.
