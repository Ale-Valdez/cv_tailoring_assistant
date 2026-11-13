# La imagen oficial trae Chromium y su propio Node (26 en Playwright 1.65).
# El paquete npm va fijado a esa misma versión. Los navegadores ya están en la imagen.
FROM mcr.microsoft.com/playwright:v1.65.0-noble

WORKDIR /app/apps/renderer

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PORT=3002

RUN printf '%s\n' '{"name":"renderer","private":true,"type":"module","dependencies":{"playwright":"1.65.0"}}' > package.json \
  && npm install

COPY apps/renderer/src ./src

EXPOSE 3002

CMD ["node", "src/index.ts"]
