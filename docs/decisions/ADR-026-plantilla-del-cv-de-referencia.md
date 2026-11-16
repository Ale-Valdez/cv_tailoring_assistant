# ADR-026: Plantilla de una columna según el CV de referencia

- Estado: Aceptada (resuelve D17)
- Fecha: 2026-11-13

## Contexto
La Fase 4 necesita una sola plantilla HTML, de una columna y legible por un ATS. El diseño de referencia es el CV de Alejandro Valdez: nombre en mayúsculas, contacto en dos columnas, títulos de sección en azul y subrayados, cada puesto como «rol | organización» con la fecha en cursiva, y bullets. Ese PDF también trae una foto, un título bajo el nombre, un párrafo de presentación por puesto, habilidades agrupadas, una línea de tecnologías por proyecto y una sección de idiomas.

## Decisión
`adapter-cv-template` implementa `CvHtmlRenderer` y arma un HTML A4 a partir de un perfil confirmado, con el orden y la jerarquía de ese CV.

- El nombre, el teléfono, el email, los enlaces, la ubicación y la foto opcional salen del contacto. La plantilla es el lugar que los vuelve a mostrar (ADR-019). Cada dato visible lleva un SVG embebido: teléfono, email y ubicación tienen icono fijo, y el de un enlace sale del host (LinkedIn, GitHub, Instagram, WhatsApp, Telegram, X, Facebook, YouTube, o uno genérico). El texto queda al lado, para que un ATS lea el teléfono, el email y la URL. El renderer no descarga una fuente de iconos.
- Si hay foto, va circular junto al nombre, como data URI. Sin foto, el encabezado no reserva un hueco. La foto no se envía al modelo.
- Las secciones, en este orden y solo si hay datos, son perfil, experiencia, proyectos, habilidades, educación e idiomas hablados. Los rótulos, los meses y el nombre del nivel siguen `displayLanguage` (`es` o `en`). El resumen, los bullets y el resto del texto quedan en el idioma en que fueron escritos (ADR-022).
- Un idioma hablado es el nombre más un nivel (`native`, `A1`…`C2`). Se muestra como «Español · Nativo» o «Inglés · B1 · Intermedio». La lista puede ir vacía. No la inventa el extractor: se carga en el editor y sí viaja en `profileForModel`, porque no es contacto.
- Un bullet que trae un rótulo corto antes de los dos puntos lo marca en negrita, como en el CV de referencia.
- Las habilidades se imprimen en el orden del perfil, separadas por comas. No se imprime si fueron extraídas o declaradas.
- No hay título profesional bajo el nombre, ni grupos de habilidades, ni párrafo de presentación del puesto, ni línea de tecnologías del proyecto. El perfil no guarda esos datos y la plantilla no los inventa.

## Consecuencias
- La vista previa y el PDF van a usar este mismo HTML.
- La fuente es una sans disponible en la imagen de Playwright (`Liberation Sans`, y si no, Arial). El CV de referencia usa Inter; no se embebe esa fuente.
- Un documento de perfil ya guardado, sin estos campos, se lee igual: idiomas vacíos, foto ausente e idioma del CV igual al idioma del texto. No hace falta una migración SQL.
- Sumar título, grupos o el párrafo de presentación del puesto sigue exigiendo campos nuevos en el perfil, no un cambio solo de CSS.

## Actualización
- 2026-11-16: la Fase 0 del plan de auditoría agrega idiomas hablados, `displayLanguage`, iconos de contacto y foto opcional. Antes la plantilla no los imprimía porque el perfil no los guardaba.
