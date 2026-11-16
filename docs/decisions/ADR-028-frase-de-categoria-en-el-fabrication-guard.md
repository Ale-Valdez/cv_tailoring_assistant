# ADR-028: Frase de categoría en el fabrication guard

- Estado: Aceptada (resuelve D28)
- Fecha: 2026-11-16

## Contexto

ADR-018 exige que todo término técnico del texto nuevo esté en el perfil o en una habilidad declarada. La Fase 4 del plan de auditoría distingue una categoría de un producto: Qdrant es una base de datos vectorial, y colas de Redis o Celery son procesamiento asíncrono. Esa frase no está escrita en el bullet, así que el guard la rechazaría aunque la tabla ya la acepta como cobertura parcial. Dejar la decisión al modelo abriría el «etc.» (embeddings, RAG, otro proveedor) que la tabla deja afuera.

## Decisión

`checkFabrication` acepta una frase de `CATEGORY_EQUIVALENCES` solo cuando un bullet citado contiene la evidencia de esa fila. Vale cualquiera de las frases de la fila, incluido el plural. Citar el bullet de la evidencia alcanza aunque el texto reescriba otro bullet.

No alcanza una habilidad sin bullet, ni un bullet con la evidencia que la sugerencia no cita. La frase no autoriza otro producto (Pinecone, RabbitMQ, SQS, Next.js, Prisma, Anthropic, microservicios) ni una cifra, una empresa o una fecha que el perfil no tiene. Redis como caché, sin colas ni Celery, no permite «procesamiento asíncrono».

El guard sigue siendo determinista y no llama a un modelo. ADR-018 queda en pie para todo lo demás.

## Consecuencias

- La tabla de `packages/domain/src/tailoring/category-equivalences.ts` es la lista cerrada. Sumar una frase es un cambio de esa tabla, no un juicio del modelo.
- `MatchResult` no cambia. La cobertura parcial y el origen del bullet siguen en la nota (Fases 4.1 y 4.3).
