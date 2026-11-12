# La imagen oficial trae Chromium y su propio Node (26 en Playwright 1.65).
FROM mcr.microsoft.com/playwright:v1.65.0-noble

WORKDIR /app

COPY apps/renderer/package.json apps/renderer/package.json
COPY apps/renderer/src apps/renderer/src

WORKDIR /app/apps/renderer

ENV PORT=3002

EXPOSE 3002

CMD ["node", "src/index.ts"]
