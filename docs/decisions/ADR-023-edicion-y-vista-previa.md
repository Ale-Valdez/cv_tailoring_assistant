# ADR-023: Edición con formularios y vista previa HTML

- Estado: Aceptada (resuelve D13)
- Fecha: 2026-11-13

## Contexto
Hay que poder corregir el CV adaptado y ver cómo queda en la página. Un editor visual libre permitiría borrar evidencia, reescribir sin pasar por el fabrication guard o desalinear el HTML del PDF.

## Decisión
- La edición sigue siendo el campo de texto de cada sugerencia. Aceptar, editar o rechazar no cambia.
- La vista previa es el HTML que arma la plantilla a partir de `profileForRender`. Se actualiza al revisar una sugerencia.
- No hay un editor WYSIWYG del CV.

## Consecuencias
- Lo que se ve en la vista previa es el mismo HTML que después recibe el renderer.
- Un cambio de texto vuelve a pasar por el fabrication guard antes de guardarse, como ya hace `ReviewSuggestion`.
- El contacto, que no viaja al modelo, aparece en esa vista porque la plantilla lo reinserta (ADR-019).
