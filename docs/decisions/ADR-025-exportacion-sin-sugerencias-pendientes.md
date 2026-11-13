# ADR-025: No exportar con sugerencias pendientes

- Estado: Aceptada
- Fecha: 2026-11-13

## Contexto
`profileForRender` deja el texto original cuando una sugerencia está `pending` o `rejected`. Faltaba decidir si ese perfil se puede mandar a PDF mientras todavía hay sugerencias sin revisar.

## Decisión
`ExportTailoredCv` rechaza el `TailoredCV` si queda alguna sugerencia `pending`. Hace falta que todas estén `accepted`, `edited` o `rejected`, que es el estado `final`. La vista previa sí se puede ver antes: una `pending` se muestra con el texto original.

## Consecuencias
- No sale un PDF que mezcle cambios ya aceptados con texto que el usuario todavía no miró.
- Rechazar una sugerencia alcanza para exportar: el texto original queda a propósito.
- Una sugerencia `edited` solo llega a guardarse si el fabrication guard la marcó válida, así que el PDF no incluye un texto que el guard haya rechazado.
