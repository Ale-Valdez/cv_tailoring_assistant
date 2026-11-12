FROM node:24.19.0-bookworm-slim AS dev

RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

WORKDIR /app

EXPOSE 3000

CMD ["pnpm", "--filter", "@cv-tailor/web", "dev"]

FROM node:24.19.0-bookworm-slim AS build

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

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps apps
COPY packages packages

# El destino del rewrite queda fijado en el build de Next.
ENV API_INTERNAL_URL=http://api:3001

RUN pnpm --filter @cv-tailor/web build

FROM node:24.19.0-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV API_INTERNAL_URL=http://api:3001

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
