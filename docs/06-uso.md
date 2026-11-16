# 06 - Uso

Recorrido para una persona: levantar CV Tailor, confirmar el perfil, pegar una oferta, revisar los cambios y descargar el PDF. Un solo usuario local, sin login.

## 1. Primera vez

Hace falta Docker, Node `24.19.0` (`.nvmrc`) y pnpm `12.18.0`.

1. Copiá `.env.example` a `.env`.
2. Completá `OPENAI_API_KEY`. El ejemplo ya trae `LLM_PROVIDER=openai` y `LLM_MODEL=gpt-6-luna`. Dejá `LLM_TEMPERATURE` vacía: ese modelo solo acepta la temperatura por defecto.
3. Dejá `LANGSMITH_TRACING=false` salvo que quieras trazas. Con `true` hacen falta `LANGSMITH_API_KEY` y `LANGSMITH_PROJECT`, y el texto que sí viaja al modelo queda guardado en LangSmith.
4. En la raíz del repo: `pnpm install`.
5. `pnpm compose`. Usa `docker-compose.dev.yml`: monta el repo y la pantalla se recarga al cambiar el código. Hace falta el `node_modules` del host. La terminal queda ocupada mientras los contenedores corren.
6. En otra terminal, con Postgres ya en marcha: `pnpm db:migrate`. Sin eso, confirmar el perfil, analizar una oferta o proponer cambios falla.

Abrí `http://localhost:3000`, o el puerto de `WEB_PORT` si lo cambiaste en el `.env`. La raíz abre Perfil. El encabezado fijo tiene Perfil, Oferta y Revisión, y tiene que decir «API disponible.». Oferta pide un perfil confirmado; Revisión, además, una oferta analizada. Si falta ese paso, la página lo dice y enlaza al anterior.

`pnpm compose:prod` levanta la imagen compilada, sin esa recarga. `pnpm dev` sirve `web`, `api` y `renderer` en el host y lee el `.env`; el PDF igual se genera con el Chromium de la imagen de `renderer`, así que para exportar conviene Compose.

Para frenar Compose: Ctrl+C en la terminal de `pnpm compose`.

## 2. Importar y confirmar el perfil

En Perfil, la primera vez, antes de elegir el PDF, la pantalla explica que el texto se envía a OpenAI. De ese texto se quitan emails y teléfonos. El nombre, la ubicación y los enlaces pueden seguir. El bloque de contacto queda vacío y lo completás vos. El aviso también dice si LangSmith está apagado o activo. **Entiendo, continuar** guarda esa aceptación en el navegador (`cv-tailor.llm-consent`). Para volver a verla, borrala en los datos del sitio y recargá sin un perfil guardado.

**Importar** pide un PDF con texto seleccionable, de hasta 10 MiB. Un archivo vacío, que no es PDF, más grande o sin texto seleccionable se rechaza en la pantalla, con el motivo.

Después corregí el borrador. Para poder confirmar hacen falta el nombre, el idioma del texto (una etiqueta corta, por ejemplo `es`) y, en cada bloque que hayas dejado, lo mínimo: organización y rol en cada experiencia, institución y título en cada formación, y nombre en cada proyecto. Una habilidad repetida no se confirma. El origen de una habilidad es «Extraída del CV» o «Declarada por vos».

El idioma del CV elige los rótulos y los meses del PDF (`Español` o `English`) y no traduce el texto. Los idiomas hablados son opcionales: cada fila tiene el nombre y el nivel (nativo, A1…C2). Español nativo e inglés B1 son dos filas. No salen del PDF importado. La foto de perfil también es opcional, circular en el PDF, en JPEG, PNG o WebP y de hasta 1 MiB. Teléfono, email, ubicación y enlaces se imprimen con un icono; el de un enlace (LinkedIn, Instagram, WhatsApp y otros) sale de la URL.

**Confirmar perfil** lo guarda. El aviso pasa a «Perfil confirmado y guardado.». Al recargar, vuelve ese perfil. Lo que no confirmaste se pierde al recargar. **Importar otro PDF** avisa que se pierde la corrección todavía no confirmada; el perfil ya guardado sigue hasta que confirmes el nuevo. El PDF original no se guarda.

Un nombre de una sola palabra se puede confirmar. Debajo del campo, la pantalla avisa que el PDF imprime ese texto tal cual. Un apellido con guion, como García-López, cuenta como una sola palabra.

Si la oferta pide TypeScript, testing, SOLID o arquitectura hexagonal y el CV no lo trae, escribilo en un bullet de un empleo o de un proyecto. Una habilidad declarada, sin ese bullet, deja el requisito en brecha; igual se puede reordenar en una propuesta. El inglés técnico se carga como idioma hablado, con su nivel.

El índice salta a Contacto, Resumen, Idioma, Idiomas hablados, Experiencia, Formación, Habilidades y Proyectos. En una pantalla ancha queda fijo al costado.

## 3. Pegar la oferta

En Oferta, en **Analizar oferta**, pegá el texto. El máximo es 50.000 caracteres. El texto se envía a OpenAI para clasificar requisitos y keywords, sin traducir. Un texto vacío no se envía. Sin un perfil confirmado, la página no muestra el formulario.

**Analizar** muestra el título, la empresa, el idioma y el recuento: cubiertos, parciales y brechas. Mientras el análisis está en curso, esa zona muestra un spinner y no el informe de la oferta anterior; si la llamada falla, ese informe vuelve. Requisitos y Keywords son dos pestañas. Cada requisito queda cubierto, parcial o brecha, con los bullets que lo sostienen. Si hay una nota, se lee debajo del estado: por ejemplo, que Qdrant respalda la categoría y no alcanza para cubrir el requisito, y si ese bullet es de un empleo o de un proyecto. Cada keyword dice si está en el perfil y, por tanto, si se puede incorporar. Si el idioma de la oferta y el del perfil difieren, un aviso lo dice y el informe no traduce. Si el texto pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces, otro aviso lo dice, en su propio recuadro. Un enlace cualquiera alcanza para que no aparezca. GitHub como tecnología, por ejemplo GitHub Actions o GitHub/GitLab, no dispara ese aviso.

La misma oferta, con el mismo texto, no vuelve a llamar al modelo. **Actualizar cobertura** vuelve a comparar contra el perfil confirmado, también sin llamarlo. La pantalla reabre la última oferta analizada.

## 4. Revisar y previsualizar

En Revisión, **Proponer cambios** arma la propuesta. Sin una oferta analizada, la página no muestra las sugerencias. Si ya existe para este perfil y esta oferta, **Actualizar propuesta** la reutiliza; si el perfil cambió, la genera de nuevo. Al modelo va el perfil sin contacto. Solo quedan reformulaciones que el perfil ya respalda: una herramienta, una empresa, una cifra o una fecha nuevas se descartan. Si no queda ningún cambio así, la pantalla lo dice y no hay PDF para exportar.

Cada sugerencia muestra el antes, el después, el motivo y la evidencia. Un orden de bullets, además, nombra el empleo (el rol y la organización) o el proyecto (su nombre). Aceptarlo cambia el orden y deja el texto de cada bullet igual: no agrega ni borra ninguno. Editar una frase de esa lista no se guarda. Mientras está pendiente podés:

- **Aceptar**, si el texto ya se sostiene.
- Editar el campo y **Guardar edición**. Si el texto nuevo no se sostiene, no se guarda y el aviso lo dice.
- **Rechazar**. Queda el texto original.

La vista previa, a la derecha, es el mismo HTML que después se exporta. Se actualiza al aceptar, guardar o rechazar. Lo que todavía está en el campo entra cuando lo guardás. Una sugerencia pendiente o rechazada deja el texto original en esa vista.

Mientras una de estas acciones corre, su botón dice en qué está («Analizando…», «Exportando…», «Guardando…», y el resto igual). Los demás quedan deshabilitados con su rótulo habitual.

## 5. Exportar el PDF

**Exportar PDF** queda arriba de las sugerencias cuando cada una fue aceptada, editada o rechazada. Cada exportación suma una versión y la descarga. Debajo quedan **Descargar versión 1**, **Descargar versión 2**, y las que sigan. Esos PDF quedan en el volumen `files` de Compose.

Si el navegador no llega al servidor, el aviso es «No hay conexión con el servidor.». Si la respuesta no trae el error de la API, es «No se pudo completar la operación.». Si la API manda su mensaje (por ejemplo «No se pudo generar el PDF.»), se muestra ese. El formulario se conserva.

## 6. Qué queda guardado

En PostgreSQL: el perfil confirmado, cada oferta analizada y la propuesta de cada par perfil-oferta, con el estado de las sugerencias y la lista de versiones. El informe de cobertura se calcula al leer y no se guarda. El PDF de la importación no se guarda. Los PDF exportados sí.

## 7. Prueba automática del recorrido

`pnpm test:e2e` abre la pantalla con Playwright y recorre Perfil, Oferta y Revisión: importar, confirmar, analizar, aceptar y descargar. Usa la Postgres de `DATABASE_URL`, en la base `cv_tailor_e2e`, y vacía esas tablas al empezar. El proceso de `api` arranca con `E2E_FIXTURES=true` y sin `OPENAI_API_KEY`: el extractor, el analizador y el proponedor devuelven un perfil, una oferta y una reformulación fijos. El PDF de la descarga lo sirve un proceso del propio test en `POST /pdf`, en los puertos 3025 (`web`), 3026 (`api`) y 3027 (ese PDF).

Hace falta que el host llegue a Postgres. `pnpm compose` publica `DB_PORT` (5432 si no lo cambiaste). La primera corrida descarga el Chromium de `@playwright/test`. Esta prueba no entra en `pnpm check` ni en el CI.
