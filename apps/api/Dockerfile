FROM node:24.19.0-bookworm-slim

RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/renderer/package.json apps/renderer/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/application/package.json packages/application/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/adapter-ai/package.json packages/adapter-ai/package.json
COPY packages/adapter-persistence/package.json packages/adapter-persistence/package.json
COPY packages/adapter-pdf-reader/package.json packages/adapter-pdf-reader/package.json
COPY packages/adapter-pdf-renderer/package.json packages/adapter-pdf-renderer/package.json
COPY packages/adapter-cv-template/package.json packages/adapter-cv-template/package.json

RUN pnpm install --frozen-lockfile --filter @cv-tailor/api...

COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages packages

WORKDIR /app/apps/api

ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/index.ts"]
