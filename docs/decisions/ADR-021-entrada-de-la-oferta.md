# ADR-021: Entrada de la oferta

- Estado: Aceptada (resuelve D18)
- Fecha: 2026-11-13

## Contexto
El MVP analiza una oferta y la compara con el perfil confirmado. Leer la oferta desde una URL exige scraping, y el texto pegado alcanza para clasificar requisitos y keywords.

## Decisión
- En el MVP la oferta entra como texto pegado. No hay scraping de URLs.
- `AnalyzeJobPosting` rechaza un texto vacío y uno de más de 50.000 caracteres (`MAX_JOB_TEXT_CHARS`). El mismo tope sale en `GET /privacy` para la pantalla.
- El caso de uso guarda el texto recortado y su hash SHA-256. Si ese hash ya está en `JobPosting`, no vuelve a llamar al modelo.
- `analyzeJobGraph`, en `adapter-ai`, extrae título, empresa, idioma, requisitos y keywords, y reintenta hasta 3 veces. El dominio normaliza las keywords con un diccionario de alias antes de guardar.

## Consecuencias
- Una URL de portal de empleo no se analiza sola: hay que pegar el texto.
- Repetir el mismo texto no genera otra llamada al proveedor ni otra fila.
- El informe de cobertura se calcula al leer, a partir de la oferta guardada y del perfil confirmado. No se persiste un `TailoredCV` en esta fase.
