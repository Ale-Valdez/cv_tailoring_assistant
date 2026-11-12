# ADR-001: TypeScript como único lenguaje

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Se evaluó un stack TypeScript full-stack frente a backend Python (FastAPI) con frontend React. Python tiene mejor ecosistema de NLP y parsing de PDF, pero la herramienta se apoya en un LLM por API y en HTML a PDF.

## Decisión
Todo el proyecto (frontend, backend, paquetes, servicio de render) se escribe en TypeScript.

## Consecuencias
- Esquemas y tipos (Zod) compartidos entre frontend y backend.
- Un solo toolchain y una sola forma de testear.
- Se usan librerías JS para leer PDF (`unpdf` o `pdfjs-dist`), con menos opciones que en Python. Mitigado por la estructuración con LLM y la corrección manual.
