# ADR-017: Conexión web a api mediante `rewrites` de Next.js

- Estado: Aceptada (resuelve D25)
- Fecha: 2026-11-12

## Contexto
`web` (Next.js, solo UI) y `api` (Express) son servicios separados (ADR-008, ADR-010). El navegador debe poder llegar a `api`. Opciones evaluadas: (A) proxy con `rewrites` de Next.js, (B) llamada directa a `api` con CORS restringido.

## Decisión
Se usa la opción A:

- El frontend llama a rutas relativas bajo `/api/*`.
- `apps/web` reenvía esas rutas a `api` con `rewrites` en `next.config`, usando la red interna de Compose (por ejemplo `http://api:<puerto>`). La URL destino se configura por variable de entorno del servidor de `web`, no pública.
- `api` no publica su puerto al host (solo es accesible desde la red de Compose). En desarrollo puede publicarse temporalmente mediante `docker-compose.dev.yml` para depurar.
- No se configura CORS en `api`.

## Consecuencias
- Para el navegador todo es el mismo origen: sin CORS, y una futura autenticación con cookies funciona sin configuración extra.
- El tráfico pasa por Next.js (un salto extra) y si `web` cae, `api` no es alcanzable desde el navegador.
- La subida del PDF atraviesa el proxy: el cuerpo queda limitado a 10 MiB en Next.js y en `api` (ver la actualización).
- Las descargas del PDF exportado también pasan por el proxy. `GET /jobs/:id/proposal/exports/:exportId` llega al navegador como `application/pdf`, con `Content-Disposition`, sin alterar los bytes.

## Actualización (2026-11-13)

`experimental.proxyClientMaxBodySize` en `apps/web` está en 10 MiB (`10 * 1024 * 1024` bytes). El default del proxy es 10 MB decimales, menor que ese tope, y un PDF válido podía caer antes de llegar a `api`. `POST /profiles/import` usa `express.raw` con el mismo `MAX_PDF_BYTES`. `POST /profiles/confirm` acepta JSON de hasta 1 MB.
