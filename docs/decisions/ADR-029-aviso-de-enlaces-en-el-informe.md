# ADR-029: Aviso de enlaces en el informe de cobertura

- Estado: Aceptada (resuelve D29)
- Fecha: 2026-11-16

## Contexto

La oferta LATAM pide un enlace a GitHub o a un portfolio en «Cómo aplicar». Desde la Fase 1 ese texto no entra como requisito, así que el hueco no aparece en `MatchResult`. El perfil ya guarda `contact.links` y la plantilla ya los imprime. Falta decir, en el informe, cuándo la oferta pide el enlace y el perfil no tiene ninguno.

## Decisión

`JobMatchReport` suma `linksNotice`, un string o `null`, al lado de `languageNotice`. `matchProfileToJob` lo llena mirando el texto crudo de la oferta y la cantidad de enlaces. No mira los requisitos.

Hay aviso solo si no hay enlaces y el texto, ya plegado, contiene alguna de estas frases: `portfolio`, `portafolio`, `enlace a github`, `link to github`, `github link`. Una sola frase alcanza. El texto es: «La oferta pide un enlace a GitHub o a un portfolio y el perfil no tiene enlaces.»

Cualquier enlace calla el aviso. GitHub como tecnología (GitHub Actions, GitHub/GitLab, la palabra sola) no lo dispara. Lo que no está en la lista no se infiere.

El informe no se persiste. No hay migración. `MatchResult` y `languageNotice` no cambian. El aviso no viaja al modelo: el contacto sigue fuera de `profileForModel` (ADR-019).

## Consecuencias

- La pantalla de la oferta muestra `linksNotice` en su propio recuadro, debajo del aviso de idioma y arriba del recuento.
- Sumar una frase es un cambio de esa lista, no un juicio del modelo.
