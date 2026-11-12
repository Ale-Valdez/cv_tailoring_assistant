# ADR-006: LangChain y LangGraph para orquestar los LLM

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Los procesos con LLM (extraer el perfil, analizar la oferta, proponer cambios con validación y reintentos) son flujos con pasos, estado y bucles.

## Decisión
Se usan LangChain (modelos, parsers de salida estructurada, prompts) y LangGraph (grafos con estado y reintentos). Viven exclusivamente en el adaptador de IA (`adapter-ai`), que implementa los puertos `ProfileExtractor`, `JobAnalyzer` y `TailoringProposer`. Los grafos son sin estado persistente: la revisión humana se modela en la capa de aplicación (ADR-015).

## Consecuencias
- El dominio y la aplicación no importan LangChain ni LangGraph.
- Las versiones se fijan, porque las APIs cambian rápido.
- Los nodos que deciden validez (fabrication guard, normalización de keywords) son deterministas.
