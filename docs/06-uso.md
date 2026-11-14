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

Abrí `http://localhost:3000`, o el puerto de `WEB_PORT` si lo cambiaste en el `.env`. El encabezado tiene que decir «API disponible.».

`pnpm compose:prod` levanta la imagen compilada, sin esa recarga. `pnpm dev` sirve `web`, `api` y `renderer` en el host y lee el `.env`; el PDF igual se genera con el Chromium de la imagen de `renderer`, así que para exportar conviene Compose.

Para frenar Compose: Ctrl+C en la terminal de `pnpm compose`.

## 2. Importar y confirmar el perfil

La primera vez, antes de elegir el PDF, la pantalla explica que el texto se envía a OpenAI. De ese texto se quitan emails y teléfonos. El nombre, la ubicación y los enlaces pueden seguir. El bloque de contacto queda vacío y lo completás vos. El aviso también dice si LangSmith está apagado o activo. **Entiendo, continuar** guarda esa aceptación en el navegador (`cv-tailor.llm-consent`). Para volver a verla, borrala en los datos del sitio y recargá sin un perfil guardado.

**Importar** pide un PDF con texto seleccionable, de hasta 10 MiB. Un archivo vacío, que no es PDF, más grande o sin texto seleccionable se rechaza en la pantalla, con el motivo.

Después corregí el borrador. Para poder confirmar hacen falta el nombre, el idioma (una etiqueta corta, por ejemplo `es`) y, en cada bloque que hayas dejado, lo mínimo: organización y rol en cada experiencia, institución y título en cada formación, y nombre en cada proyecto. Una habilidad repetida no se confirma. El origen de una habilidad es «Extraída del CV» o «Declarada por vos».

**Confirmar perfil** lo guarda. El aviso pasa a «Perfil confirmado y guardado.». Al recargar, vuelve ese perfil. Lo que no confirmaste se pierde al recargar. **Importar otro PDF** avisa que se pierde la corrección todavía no confirmada; el perfil ya guardado sigue hasta que confirmes el nuevo. El PDF original no se guarda.

## 3. Pegar la oferta

En **Analizar oferta**, pegá el texto. El máximo es 50.000 caracteres. El texto se envía a OpenAI para clasificar requisitos y keywords, sin traducir. Un texto vacío no se envía.

**Analizar** muestra el título, la empresa, el idioma, los requisitos y las keywords. Cada requisito queda cubierto, parcial o brecha, con los bullets que lo sostienen. Cada keyword dice si está en el perfil y, por tanto, si se puede incorporar. Si el idioma de la oferta y el del perfil difieren, un aviso lo dice y el informe no traduce.

La misma oferta, con el mismo texto, no vuelve a llamar al modelo. **Actualizar cobertura** vuelve a comparar contra el perfil confirmado, también sin llamarlo. La pantalla reabre la última oferta analizada.

## 4. Revisar y previsualizar

**Proponer cambios** arma la propuesta. Si ya existe para este perfil y esta oferta, **Actualizar propuesta** la reutiliza; si el perfil cambió, la genera de nuevo. Al modelo va el perfil sin contacto. Solo quedan reformulaciones que el perfil ya respalda: una herramienta, una empresa, una cifra o una fecha nuevas se descartan. Si no queda ningún cambio así, la pantalla lo dice y no hay PDF para exportar.

Cada sugerencia muestra el antes, el después, el motivo y la evidencia. Mientras está pendiente podés:

- **Aceptar**, si el texto ya se sostiene.
- Editar el campo y **Guardar edición**. Si el texto nuevo no se sostiene, no se guarda y el aviso lo dice.
- **Rechazar**. Queda el texto original.

La vista previa, a la derecha, es el mismo HTML que después se exporta. Se actualiza al aceptar, guardar o rechazar. Lo que todavía está en el campo entra cuando lo guardás. Una sugerencia pendiente o rechazada deja el texto original en esa vista.

Mientras una de estas acciones corre, su botón dice en qué está («Analizando…», «Exportando…», «Guardando…», y el resto igual). Los demás quedan deshabilitados con su rótulo habitual.

## 5. Exportar el PDF

**Exportar PDF** aparece cuando cada sugerencia fue aceptada, editada o rechazada. Cada exportación suma una versión y la descarga. Debajo quedan **Descargar versión 1**, **Descargar versión 2**, y las que sigan. Esos PDF quedan en el volumen `files` de Compose.

Si el navegador no llega al servidor, el aviso es «No hay conexión con el servidor.». Si la respuesta no trae el error de la API, es «No se pudo completar la operación.». Si la API manda su mensaje (por ejemplo «No se pudo generar el PDF.»), se muestra ese. El formulario se conserva.

## 6. Qué queda guardado

En PostgreSQL: el perfil confirmado, cada oferta analizada y la propuesta de cada par perfil-oferta, con el estado de las sugerencias y la lista de versiones. El informe de cobertura se calcula al leer y no se guarda. El PDF de la importación no se guarda. Los PDF exportados sí.

## 7. Prueba automática del recorrido

`pnpm test:e2e` abre la pantalla con Playwright y recorre importar, confirmar, analizar, aceptar y descargar. Usa la Postgres de `DATABASE_URL`, en la base `cv_tailor_e2e`, y vacía esas tablas al empezar. El proceso de `api` arranca con `E2E_FIXTURES=true` y sin `OPENAI_API_KEY`: el extractor, el analizador y el proponedor devuelven un perfil, una oferta y una reformulación fijos. El PDF de la descarga lo sirve un proceso del propio test en `POST /pdf`, en los puertos 3025 (`web`), 3026 (`api`) y 3027 (ese PDF).

Hace falta que el host llegue a Postgres. `pnpm compose` publica `DB_PORT` (5432 si no lo cambiaste). La primera corrida descarga el Chromium de `@playwright/test`. Esta prueba no entra en `pnpm check` ni en el CI.
