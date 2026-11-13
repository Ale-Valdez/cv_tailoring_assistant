# ADR-011: OpenAI como proveedor de LLM, intercambiable por `.env`

- Estado: Aceptada (resuelve D11)
- Fecha: 2026-11-12

## Contexto
ADR-002 fijó un LLM en la nube con proveedor intercambiable, dejando pendiente cuál. Se requiere que cambiar de proveedor sea sencillo y se controle desde el `.env`.

## Decisión
- El proveedor inicial es OpenAI, con salida estructurada (Zod).
- Dentro de `adapter-ai` hay una fábrica de modelos (`ModelFactory`) que lee la configuración del `.env` y devuelve un chat model de LangChain. Los grafos y nodos solo reciben el modelo ya construido y nunca importan un proveedor concreto.
- Variables de entorno previstas:
  - `LLM_PROVIDER=openai`
  - `LLM_MODEL=<modelo>` (se fija al implementar la Fase 0/1)
  - `OPENAI_API_KEY=...`
  - `LLM_TEMPERATURE` (opcional)
- La fábrica funciona como un registro `proveedor -> constructor`. Agregar otro proveedor implica instalar su paquete de LangChain y registrar una entrada en la fábrica, más las variables de ese proveedor (por ejemplo `ANTHROPIC_API_KEY`). El dominio, la aplicación y los grafos no cambian.
- Se validan al arrancar `api` las variables obligatorias para el proveedor activo, y falla rápido con un mensaje claro si faltan.

## Consecuencias
- Hay dos niveles de aislamiento: los puertos hexagonales (`ProfileExtractor`, `JobAnalyzer`, `TailoringProposer`) ocultan la IA al núcleo, y la fábrica oculta el proveedor al resto del adaptador.
- Los modelos de distintos proveedores soportan salida estructurada con matices distintos; al cambiar de proveedor hay que validar los prompts y esquemas.
- El nombre exacto del modelo queda para la implementación.

## Actualización (2026-11-13)

El valor de ejemplo de `LLM_MODEL` es `gpt-6-luna`, en `.env.example`. La fábrica sigue leyendo esa variable: otro identificador de OpenAI no cambia los grafos. `extractProfileGraph` valida la salida y reintenta hasta 3 veces. `gpt-6-luna` rechaza cualquier `temperature` distinta del valor por defecto, así que el ejemplo deja `LLM_TEMPERATURE` vacío y la fábrica no envía el parámetro. Otros identificadores pueden fijarlo.
