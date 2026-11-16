# ADR-030: Orden de los bullets de un empleo o de un proyecto

- Estado: Aceptada (resuelve D30)
- Fecha: 2026-11-16

## Contexto

Una sugerencia puede reformular un bullet, el resumen o el orden de las habilidades. No puede cambiar el orden de los bullets dentro de un empleo o de un proyecto. En una oferta como la de LATAM, el trabajo con React, Node y PostgreSQL queda debajo de otros bullets aunque la oferta lo pida primero. Reescribir el texto para «subirlo» inventaría una presentación que el perfil no tiene en ese orden, y mezclaría el cambio de orden con un cambio de redacción.

## Decisión

`Suggestion` suma el objetivo `bullet_order`. El `owner` es un empleo (`experienceId`) o un proyecto (`projectId`). `before` y `after` son los textos de ese bloque, uno por línea.

`checkFabrication` exige la misma lista, plegada como las habilidades. No pasa por el control de términos: el texto ya está en el perfil. No acepta un alta, una baja, un texto cambiado ni un repetido. Un bloque con menos de dos bullets no se reordena. Si dos textos pliegan igual, o un bullet ocupa más de una línea, la sugerencia es inválida. La evidencia es al menos un bullet de ese bloque.

`profileForRender` resuelve las líneas contra los textos de la instantánea y reordena por id. Una reescritura aceptada del mismo bloque no desarma el orden. Los ids y los textos se conservan. No mueve bullets a otro bloque.

Una sugerencia ya guardada, sin este tipo, sigue siendo válida. No hay migración.

## Consecuencias

- Desde la Fase 6.2 el prompt pide `bullet_order`: `ownerType` y `ownerId` identifican el empleo o el proyecto, y `after` es la misma lista, un texto por línea. Desde la Fase 6.3 la revisión muestra ese bloque junto al rótulo «Orden de bullets»: el rol y la organización, o el nombre del proyecto.
- ADR-018 sigue en pie: reordenar no autoriza un término, una cifra, una empresa ni una fecha nuevos.
