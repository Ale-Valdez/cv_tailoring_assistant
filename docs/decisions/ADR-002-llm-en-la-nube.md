# ADR-002: LLM por API en la nube, proveedor intercambiable

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Alternativas: LLM local (Ollama), API en la nube, o híbrido. El LLM local da privacidad total, pero menor calidad y requiere más hardware.

## Decisión
Se usa un LLM por API en la nube con salida estructurada. El proveedor se elige por configuración mediante una fábrica de modelos dentro del adaptador de IA. El proveedor inicial es OpenAI (ADR-011).

## Consecuencias
- El CV viaja a un tercero: se mitiga no enviando datos de contacto (ADR-019).
- Costo y latencia por llamada: se mitiga con caché y reintentos acotados.
- Cambiar de proveedor no afecta al dominio ni a la aplicación.
