# ADR-024: Playwright para generar el PDF

- Estado: Aceptada (resuelve D19)
- Fecha: 2026-11-13

## Contexto
El PDF tiene que coincidir con el HTML de la vista previa, incluidos los saltos de página A4. `html2pdf.js` corre en el navegador y no reproduce igual el CSS de impresión. ADR-014 ya aisló Chromium en el servicio `renderer`.

## Decisión
El PDF lo genera Playwright (Chromium) dentro de `apps/renderer`. `api` no embebe Chromium: llama al puerto `PdfGenerator`, implementado por `adapter-pdf-renderer`.

## Consecuencias
- La imagen de `renderer` es más pesada que una librería en el navegador, y el PDF sale del mismo motor que pinta el HTML.
- `apps/renderer` sigue sin conocer el dominio: `POST /pdf` recibe `text/html` y responde `application/pdf`. El PDF es A4 y usa el tamaño de página del CSS. Chromium se abre en la primera conversión. `GET /health` no cambia y no depende del navegador.
- El paquete npm `playwright` queda en `1.65.0`, igual que la imagen. Los navegadores no se vuelven a descargar: la imagen ya los trae.
- `adapter-pdf-renderer` llama a `RENDERER_URL`. `api` lo usará al exportar.
- Playwright no se importa desde ningún otro paquete (ADR-016).
