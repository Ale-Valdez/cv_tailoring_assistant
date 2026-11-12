# ADR-010: Next.js solo como UI

- Estado: Aceptada
- Fecha: 2026-11-12

## Contexto
Al separar el backend en Express (ADR-008), Next.js pierde su ventaja principal (rutas de servidor). Se propuso Vite + React como alternativa más simple. Se decidió mantener Next.js.

## Decisión
`apps/web` usa Next.js solo como interfaz, sin route handlers ni lógica de servidor propia. Depende únicamente de `contracts`.

## Consecuencias
- Hay dos servidores (web y api). La conexión se resuelve en ADR-017 (`rewrites`).
- Se conserva la familiaridad con el ecosistema Next.js y la posibilidad de usar sus funciones de UI.
- Si Next.js resultara innecesario, migrar a Vite + React es acotado porque no contiene lógica de servidor.
