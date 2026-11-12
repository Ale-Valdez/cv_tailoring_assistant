# ADR-018: Política anti-invención

- Estado: Aceptada (resuelve D12)
- Fecha: 2026-11-12

## Contexto
La regla de negocio es no inventar experiencia. El LLM puede reformular un bullet para acercarlo al vocabulario de la oferta, y en ese paso puede colar una herramienta, una empresa, una cifra o una fecha que el perfil no respalda. También hace falta un camino para una habilidad real que el PDF no trajo y que el usuario quiere dejar escrita.

## Decisión
- Permitido: reordenar, resumir, reformular, enfatizar y usar el vocabulario de la oferta para algo que el candidato sí hizo.
- Prohibido: añadir skills, herramientas, logros, empresas, cifras o fechas que no estén en el perfil ni en una habilidad declarada por el usuario.
- Una `Suggestion` solo es válida si cita al menos un `Bullet` o campo del perfil como evidencia, y si todo término técnico, empresa, número o fecha del texto nuevo aparece en el perfil o en una `SkillEntry` declarada por el usuario.
- Esas habilidades se guardan con `SkillEntry.source` en `declarada por el usuario`, distintas de las extraídas del CV.
- El fabrication guard es un servicio de dominio determinista. No llama a un LLM. Rechaza la sugerencia si falta la evidencia o si el texto introduce un término no respaldado.

## Consecuencias
- El usuario puede completar el perfil con una habilidad real omitida por el PDF, y esa habilidad queda distinguible de las extraídas.
- Una sugerencia que se apoya en una habilidad declarada es válida. Una que introduce un término sin esa marca, no.
- El guard se prueba con casos fijos, sin modelo.
