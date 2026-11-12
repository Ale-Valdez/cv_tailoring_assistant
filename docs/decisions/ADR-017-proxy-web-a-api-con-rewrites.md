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
- La subida del PDF atraviesa el proxy: hay que revisar y configurar los límites de tamaño del cuerpo de la petición en Next.js al implementar la importación de perfil (Fase 1), y fijar un límite de tamaño de archivo también en `api`.
- Las descargas del PDF exportado también pasan por el proxy; verificar el manejo de respuestas binarias al implementar `ExportTailoredCv`.
