# ADR-007: LangSmith solo para monitoreo, por variables de entorno

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
LangSmith puede usarse para trazas, datasets y evaluación. Se pidió limitarlo a monitoreo.

## Decisión
Solo se configuran variables de entorno en el servicio `api` (`LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, y `LANGSMITH_ENDPOINT` si hace falta). No hay código propio de observabilidad, ni datasets, ni anonimizadores.

## Consecuencias
- Con el trazado activado, el contenido del CV queda guardado en LangSmith. Se apaga con `LANGSMITH_TRACING=false`.
- Si más adelante se necesita evaluación o enmascarado, se registrará un nuevo ADR.
