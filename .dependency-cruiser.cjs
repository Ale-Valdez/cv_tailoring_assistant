/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-only-zod",
      severity: "error",
      comment:
        "domain no importa nada del monorepo ni librerías de infraestructura. Solo Zod (ADR-016).",
      from: { path: "^packages/domain/" },
      to: {
        pathNot: ["^packages/domain/", "(^|/)node_modules/zod(/|$)"],
      },
    },
    {
      name: "application-only-domain",
      severity: "error",
      comment: "application solo importa domain (ADR-016).",
      from: { path: "^packages/application/" },
      to: {
        pathNot: ["^packages/application/", "^packages/domain/"],
      },
    },
    {
      name: "contracts-only-domain-or-zod",
      severity: "error",
      comment:
        "contracts solo importa domain, o nada del monorepo, y Zod (docs/02-arquitectura.md).",
      from: { path: "^packages/contracts/" },
      to: {
        pathNot: ["^packages/contracts/", "^packages/domain/", "(^|/)node_modules/zod(/|$)"],
      },
    },
    {
      name: "adapter-does-not-import-another-adapter",
      severity: "error",
      comment: "Ningún adapter-* importa otro adapter-* (ADR-016).",
      from: { path: "^packages/(adapter-[^/]+)/" },
      to: {
        path: "^packages/adapter-|^@cv-tailor/adapter-",
        pathNot: "^packages/$1/|^@cv-tailor/$1$",
      },
    },
    {
      name: "adapter-does-not-import-contracts",
      severity: "error",
      comment:
        "Los adaptadores dependen de application y domain, no de contracts (docs/02-arquitectura.md).",
      from: { path: "^packages/adapter-" },
      to: { path: "^packages/contracts/|^@cv-tailor/contracts$" },
    },
    {
      name: "packages-do-not-import-apps",
      severity: "error",
      comment: "Ningún paquete interno importa de apps/* (ADR-016).",
      from: { path: "^packages/" },
      to: { path: "^apps/|^@cv-tailor/(api|web|renderer)$" },
    },
    {
      name: "web-only-contracts",
      severity: "error",
      comment: "apps/web solo importa contracts del monorepo (ADR-016).",
      from: { path: "^apps/web/" },
      to: {
        path: "^(packages|apps)/|^@cv-tailor/",
        pathNot: ["^packages/contracts/", "^apps/web/", "^@cv-tailor/contracts$"],
      },
    },
    {
      name: "renderer-has-no-monorepo-deps",
      severity: "error",
      comment:
        "apps/renderer no depende de ningún paquete del monorepo (docs/02-arquitectura.md).",
      from: { path: "^apps/renderer/" },
      to: { path: "^packages/|^@cv-tailor/" },
    },
    {
      name: "api-is-composition-root",
      severity: "error",
      comment:
        "apps/api importa application, contracts y los adaptadores. No importa domain, web ni renderer (docs/02-arquitectura.md).",
      from: { path: "^apps/api/" },
      to: {
        path: "^(packages/domain|apps/web|apps/renderer)/|^@cv-tailor/(domain|web|renderer)$",
      },
    },
    {
      name: "express-only-in-api",
      severity: "error",
      comment: "Express solo se importa desde apps/api (ADR-016).",
      from: { pathNot: "^apps/api/" },
      to: { path: "(^|/)node_modules/express(/|$)|^express(/|$)" },
    },
    {
      name: "prisma-only-in-persistence",
      severity: "error",
      comment: "Prisma solo se importa desde adapter-persistence (ADR-016).",
      from: { pathNot: "^packages/adapter-persistence/" },
      to: {
        path: "(^|/)node_modules/(prisma|@prisma)(/|$)|^prisma(/|$)|^@prisma/",
      },
    },
    {
      name: "langchain-only-in-adapter-ai",
      severity: "error",
      comment:
        "LangChain, LangGraph y el SDK de OpenAI solo se importan desde adapter-ai (ADR-011, ADR-016).",
      from: { pathNot: "^packages/adapter-ai/" },
      to: {
        path: "(^|/)node_modules/(langchain|langgraph|openai)(/|$)|(^|/)node_modules/@langchain/|^(langchain|langgraph|openai)(/|$)|^@langchain/",
      },
    },
    {
      name: "playwright-only-in-renderer",
      severity: "error",
      comment:
        "El paquete playwright solo se importa desde apps/renderer (ADR-014, ADR-016). @playwright/test es otra regla.",
      from: { pathNot: "^apps/renderer/" },
      to: {
        path: "(^|/)node_modules/(playwright|playwright-core)(/|$)|^(playwright|playwright-core)(/|$)",
      },
    },
    {
      name: "playwright-test-only-in-e2e",
      severity: "error",
      comment: "@playwright/test solo se importa desde tests/ (ADR-016).",
      from: { pathNot: "^tests/" },
      to: {
        path: "(^|/)node_modules/@playwright/|^@playwright/",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      // Los tests importan Vitest. No es dependencia de producción (ADR-016).
      path: "(^|/)\\.next/|\\.css$|\\.test\\.ts$|(^|/)vitest\\.config\\.ts$|(^|/)(test-results|playwright-report)/",
    },
    // dependency-cruiser 18 no acepta TypeScript 7. swc lee los .ts y también los import type.
    parser: "swc",
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "types", "node", "default"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
    },
  },
};
