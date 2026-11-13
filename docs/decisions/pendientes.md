# Decisiones pendientes

Cada una tiene una propuesta. Cuando se resuelva, crear un ADR nuevo (`ADR-0NN-...md`), cambiar el estado aquí a "Resuelta (ADR-0NN)" y actualizar `docs/README.md`.

Estados: Propuesta (esperando aprobación), Resuelta.

| ID | Tema | Propuesta | Estado |
| --- | --- | --- | --- |
| D11 | Proveedor de LLM | OpenAI, con fábrica de modelos cambiable por `.env` | Resuelta (ADR-011) |
| D12 | Política anti-invención | Permitir reformular y reordenar, prohibir términos nuevos, y permitir "habilidades declaradas por el usuario" marcadas como tales | Resuelta (ADR-018) |
| D13 | Edición | Formularios estructurados con vista previa HTML en vivo, sin editor WYSIWYG libre | Propuesta |
| D14 | Idioma | El CV se mantiene en su idioma original; ofertas en otro idioma se informan sin traducir en el MVP | Resuelta (ADR-022) |
| D15 | Entrada del PDF | Solo PDFs con texto en el MVP, con corrección manual obligatoria; OCR más adelante | Resuelta (ADR-020) |
| D16 | Privacidad | No enviar datos de contacto al LLM, avisar la primera vez que el CV se envía al proveedor, documentar cómo apagar LangSmith | Resuelta (ADR-019) |
| D17 | Plantilla | Una plantilla de una columna, amigable para ATS. Pendiente: ¿hay un CV de referencia cuyo diseño replicar? | Propuesta |
| D18 | Entrada de la oferta | Texto pegado en el MVP; scraping de URLs después | Resuelta (ADR-021) |
| D19 | Generador de PDF | Playwright (Chromium) por fidelidad con CSS de impresión, aunque es más pesado que `html2pdf.js` | Propuesta |
| D20 | Herramientas del monorepo | pnpm workspaces (Turborepo pasa a D26) | Resuelta (ADR-012) |
| D21 | Persistencia | PostgreSQL como servicio de Compose, con Prisma | Resuelta (ADR-013) |
| D22 | Servicio `renderer` separado | Servicio aparte con la imagen de Playwright, para aislar Chromium del contenedor `api` | Resuelta (ADR-014) |
| D23 | Revisión humana | En la capa de aplicación: estados de `Suggestion` en la base de datos; grafos de LangGraph sin estado ni checkpointer, en lugar de interrupciones de LangGraph | Resuelta (ADR-015) |
| D24 | Verificación de límites hexagonales | `dependency-cruiser` en CI (confirmado en la Fase 0) | Resuelta (ADR-016) |
| D25 | Conexión web a api | `rewrites` de Next.js (el navegador solo habla con `web`, sin CORS); alternativa: llamada directa a `api` con CORS restringido | Resuelta (ADR-017) |
| D26 | Turborepo | No adoptarlo al inicio; sumarlo si los tiempos de build o test lo justifican | Propuesta |

Ninguna decisión bloquea ya la Fase 0. D12 y D16 quedaron resueltas antes de la Fase 1. D15 quedó resuelta al implementar `ImportProfileFromPdf` (ADR-020). D18 y D14 quedaron resueltas con el análisis de la oferta (ADR-021, ADR-022). Orden sugerido del resto: antes de la fase que los necesite (D13 y D17 antes de la Fase 4).
