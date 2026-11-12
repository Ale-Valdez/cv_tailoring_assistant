# ADR-015: Revisión humana en la capa de aplicación, grafos sin estado

- Estado: Aceptada (resuelve D23)
- Fecha: 2026-11-12

## Contexto
El usuario debe aceptar, editar o rechazar cada sugerencia antes de exportar. LangGraph permite pausar un grafo con interrupciones, pero eso exige un checkpointer persistente y deja ejecuciones pausadas que deben sobrevivir a reinicios.

## Decisión
- La revisión no se modela dentro de LangGraph. Cada `Suggestion` se guarda con su estado (pendiente, aceptada, editada, rechazada) en PostgreSQL.
- El usuario cambia el estado mediante el caso de uso `ReviewSuggestion`. Las transiciones válidas son reglas del dominio.
- Los grafos de `adapter-ai` (`extractProfileGraph`, `analyzeJobGraph`, `proposeTailoringGraph`) se ejecutan de principio a fin sin estado persistente y sin checkpointer.

## Consecuencias
- El flujo de revisión es parte del dominio y se prueba sin IA.
- No hay checkpointer ni estado de ejecución que migrar o limpiar.
- Si más adelante se quiere un flujo conversacional con pausas dentro del grafo, habrá que revisar esta decisión con un nuevo ADR.
