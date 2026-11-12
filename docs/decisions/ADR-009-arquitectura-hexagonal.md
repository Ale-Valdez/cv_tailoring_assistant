# ADR-009: Arquitectura hexagonal (puertos y adaptadores)

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
El sistema depende de componentes volátiles (proveedor de LLM, LangChain/LangGraph, base de datos, generador de PDF). Además, el riesgo central (invención de experiencia) se controla mejor con reglas de dominio puras y testeables.

## Decisión
- Dominio: entidades y servicios puros (fabrication guard, normalización de keywords, transiciones de estado de sugerencias).
- Aplicación: casos de uso y definición de puertos.
- Adaptadores de entrada: API Express.
- Adaptadores de salida: persistencia (Prisma), IA (LangChain/LangGraph), lectura de PDF, cliente del renderer, plantilla HTML. Cada uno en un paquete `adapter-*`.
- Los puertos se crean solo donde hay una dependencia externa real.

## Consecuencias
- Casos de uso testeables con adaptadores falsos, sin LLM, base de datos ni red.
- Proveedor de LLM, base de datos y generador de PDF reemplazables sin tocar el núcleo.
- Más capas y código de mapeo. Se mitiga con la regla de pragmatismo de puertos.
- Las reglas de dependencias se verifican en CI (ADR-016).
- Detalle en `docs/02-arquitectura.md`.
