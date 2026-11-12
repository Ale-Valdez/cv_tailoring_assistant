# ADR-019: Privacidad del CV frente al LLM y a LangSmith

- Estado: Aceptada (resuelve D16)
- Fecha: 2026-11-12

## Contexto
El CV viaja a un proveedor en la nube (ADR-002, ADR-011). Con LangSmith activado, las trazas guardan entradas y salidas del modelo (ADR-007). El bloque de contacto no hace falta para extraer experiencia ni para proponer cambios, y es el dato más sensible del perfil.

## Decisión
- No se envían al LLM los datos de contacto del perfil: nombre, email, teléfono, ubicación y enlaces. Se persisten en el perfil y se reinsertan al renderizar el HTML.
- El resumen, la experiencia, la educación, los proyectos y las habilidades sí pueden enviarse: sin ellos no hay extracción ni propuesta.
- La primera vez que un CV va a salir hacia el proveedor, la interfaz avisa antes de la llamada y recuerda que, si `LANGSMITH_TRACING=true`, ese mismo contenido queda en LangSmith. Con un solo usuario local (ADR-003), la aceptación se guarda en el navegador.
- LangSmith se apaga dejando `LANGSMITH_TRACING=false`, ya documentado en `.env.example`. No hay enmascarado ni código propio de trazado.

## Consecuencias
- El adaptador de IA recibe el perfil sin el bloque de contacto. La plantilla lo vuelve a poner al armar el HTML.
- No hay primera llamada al proveedor sin ese aviso.
- Apagar LangSmith no requiere cambios de código. Con el trazado activo, lo que sí se envió al modelo queda guardado en LangSmith.
