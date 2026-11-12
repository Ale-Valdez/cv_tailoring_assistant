# ADR-014: Servicio `renderer` separado para HTML a PDF

- Estado: Aceptada (resuelve D22)
- Fecha: 2026-11-12

## Contexto
La generación de PDF usa Playwright (Chromium), que es pesado y necesita dependencias del sistema y fuentes. Alternativa: ejecutarlo dentro del contenedor `api`.

## Decisión
`apps/renderer` es un servicio HTTP interno mínimo, con la imagen oficial de Playwright. Recibe un string HTML y devuelve el PDF. No conoce el dominio, no depende de ningún paquete del monorepo y no publica puertos al host (solo accesible desde `api` por la red interna de Compose). `api` lo consume mediante el puerto `PdfGenerator`, implementado en `adapter-pdf-renderer`.

## Consecuencias
- La imagen de `api` no incluye Chromium y se mantiene liviana.
- Las fuentes y el entorno de render son fijos y reproducibles.
- Un servicio más que levantar y monitorear. El `healthcheck` de `renderer` es parte de la configuración de Compose.
