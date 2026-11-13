# ADR-026: Plantilla de una columna según el CV de referencia

- Estado: Aceptada (resuelve D17)
- Fecha: 2026-11-13

## Contexto
La Fase 4 necesita una sola plantilla HTML, de una columna y legible por un ATS. El diseño de referencia es el CV de Alejandro Valdez: nombre en mayúsculas, contacto en dos columnas, títulos de sección en azul y subrayados, cada puesto como «rol | organización» con la fecha en cursiva, y bullets. Ese PDF también trae una foto, un título bajo el nombre, un párrafo de presentación por puesto, habilidades agrupadas, una línea de tecnologías por proyecto y una sección de idiomas.

## Decisión
`adapter-cv-template` implementa `CvHtmlRenderer` y arma un HTML A4 a partir de un perfil confirmado, con el orden y la jerarquía de ese CV.

- El nombre, el teléfono, el email, los enlaces y la ubicación salen del contacto. La plantilla es el lugar que los vuelve a mostrar (ADR-019).
- Las secciones, en este orden y solo si hay datos, son perfil, experiencia, proyectos, habilidades y educación. Los rótulos y los meses van en español, salvo que el idioma del perfil empiece por `en`.
- Un bullet que trae un rótulo corto antes de los dos puntos lo marca en negrita, como en el CV de referencia.
- Las habilidades se imprimen en el orden del perfil, separadas por comas. No se imprime si fueron extraídas o declaradas.
- No hay foto, ni título profesional bajo el nombre, ni grupos de habilidades, ni idiomas hablados, ni párrafo de presentación del puesto, ni línea de tecnologías del proyecto. El perfil no guarda esos datos y la plantilla no los inventa.

## Consecuencias
- La vista previa y el PDF van a usar este mismo HTML.
- La fuente es una sans disponible en la imagen de Playwright (`Liberation Sans`, y si no, Arial). El CV de referencia usa Inter; no se embebe esa fuente.
- Sumar foto, título, grupos o idiomas exige campos nuevos en el perfil, no un cambio solo de CSS.
