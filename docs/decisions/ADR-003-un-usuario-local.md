# ADR-003: Un solo usuario, ejecución local, sin login

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Alternativa: multiusuario o SaaS desde el inicio (autenticación, Postgres, despliegue).

## Decisión
El MVP es de un solo usuario que ejecuta la aplicación localmente con Docker Compose. Sin autenticación ni multiusuario.

## Consecuencias
- Menos superficie de seguridad y menos código en el MVP.
- El modelo de dominio no incluye `User`. Si más adelante se hace multiusuario, habrá que agregar propiedad de los datos en el dominio y la persistencia.
