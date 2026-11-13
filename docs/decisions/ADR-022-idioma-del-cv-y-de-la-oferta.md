# ADR-022: Idioma del CV y de la oferta

- Estado: Aceptada (resuelve D14)
- Fecha: 2026-11-13

## Contexto
El perfil y la oferta pueden estar en idiomas distintos. Traducir el CV para acercarlo a la oferta cambiaría la fuente de verdad y podría meter términos que el candidato no escribió.

## Decisión
- El CV se mantiene en su idioma original. Ni la importación ni el análisis traducen textos.
- Si el idioma de la oferta y el del perfil confirmado difieren, el informe de cobertura lo dice y compara términos sin traducir.
- Si falta uno de los dos idiomas, o si coinciden (también cuando uno dice `es` y el otro `español`), no hay aviso.

## Consecuencias
- Una oferta en inglés contra un perfil en español puede marcar brechas solo porque el término no coincide palabra por palabra.
- La traducción queda fuera del MVP.
