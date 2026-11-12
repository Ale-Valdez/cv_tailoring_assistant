# 01 - Análisis del problema

## Problema y objetivos

Adaptar un CV a una oferta laboral concreta lleva tiempo y es fácil caer en dos errores: enviar un CV genérico que los ATS filtran, o inflar la experiencia. CV Tailor resuelve esto con tres principios:

- **Fuente de verdad única.** El "perfil maestro" es el CV real, estructurado y verificado por el usuario. Toda versión adaptada se deriva de él.
- **Cero invención.** Cada afirmación del CV adaptado debe poder rastrearse a un dato del perfil maestro (ADR-018). Si la oferta pide algo que no está, se informa como brecha y no se rellena. Una habilidad que el usuario declara a mano queda marcada como tal.
- **El humano decide.** Nada se exporta sin que el usuario haya revisado, editado, aceptado o rechazado cada cambio.

Capacidades buscadas:

- Cargar un CV existente (PDF).
- Analizar una oferta laboral e identificar requisitos técnicos y funcionales.
- Comparar los requisitos con la experiencia real del candidato.
- Detectar palabras clave relevantes para sistemas ATS.
- Proponer modificaciones sin inventar experiencia ni conocimientos.
- Generar una nueva versión del CV adaptada a la oferta.
- Revisar y editar los cambios antes de exportar.
- El CV es un HTML con formato de documento; al descargar, una librería lo convierte a PDF.

## Usuarios y casos de uso

Usuario principal: una persona buscando empleo, con perfil técnico, que posta a varias ofertas. En el MVP es un solo usuario (el autor del proyecto).

- UC1: Cargar un CV en PDF y obtener un perfil estructurado editable.
- UC2: Pegar una oferta y ver requisitos técnicos y funcionales, obligatorios y deseables.
- UC3: Ver la cobertura requisito por requisito (cubierto, parcial, brecha) con la evidencia del CV.
- UC4: Ver palabras clave ATS presentes y ausentes, y cuáles se pueden incorporar legítimamente.
- UC5: Revisar propuestas de cambio (antes/después, justificación, evidencia) y aceptar, editar o rechazar.
- UC6: Previsualizar el CV en HTML con formato A4 y exportarlo a PDF.
- UC7: Guardar varias versiones, una por oferta, y reabrirlas.

## MVP

1. Monorepo levantable con un solo comando (`docker compose up`).
2. Subida de PDF, extracción de texto y estructuración a perfil JSON, con pantalla de corrección manual.
3. Oferta ingresada por texto pegado (sin scraping de URLs).
4. Análisis de oferta: requisitos clasificados y palabras clave.
5. Matching con evidencia y reporte de brechas.
6. Sugerencias discretas (resumen, orden de skills, reescritura de bullets) con aceptar, editar o rechazar.
7. Plantilla HTML única, A4, una columna (amigable para ATS), con vista previa en vivo.
8. Exportación a PDF desde el HTML con Playwright.
9. Persistencia local de perfil, ofertas y versiones.
10. Monitoreo de las ejecuciones de LLM en LangSmith, activado solo con variables de entorno.

## Fuera del MVP

Scraping de URLs, múltiples plantillas, carta de presentación, login y multiusuario, OCR de PDFs escaneados, puntaje ATS numérico, seguimiento de postulaciones, despliegue en la nube.
