# ADR-020: Entrada del PDF

- Estado: Aceptada (resuelve D15)
- Fecha: 2026-11-13

## Contexto
El MVP carga un CV en PDF y lo convierte en un perfil que el usuario corrige. Un PDF escaneado no trae texto seleccionable; leerlo exige OCR. La extracción, además, se equivoca, y el perfil maestro solo sirve como fuente de verdad después de esa revisión.

## Decisión
- En el MVP solo se aceptan PDFs con texto seleccionable. Si el texto extraído queda vacío, o si después de quitar emails y teléfonos no queda nada, la importación falla. El OCR queda fuera del MVP.
- El perfil importado queda en `needs_review`. Confirmarlo es otro paso, con `confirmProfile`, después de la corrección manual.
- El caso de uso rechaza un archivo vacío y uno de más de 10 MiB (`MAX_PDF_BYTES`). Ese mismo tope está en el cuerpo de la petición de Next.js y de `api` (ADR-017).
- El lector de texto es `unpdf`, en `adapter-pdf-reader`. El puerto `ProfileExtractor` lo implementa el adaptador de IA con LangGraph.
- Antes de llamar al extractor se quitan emails y teléfonos. El bloque de contacto del perfil importado queda vacío y lo completa el usuario. El nombre, la ubicación y las URLs pueden seguir en el texto (ADR-019).

## Consecuencias
- Un PDF escaneado no entra.
- Ningún perfil importado sale confirmado, aunque los datos extraídos estén completos.
- Las habilidades que salen de esta importación quedan con `source` `extracted_from_cv`.
- El aviso de la primera llamada al proveedor (ADR-019) se muestra en la pantalla de importación y queda guardado en el navegador. El perfil corregido todavía no se persiste.
