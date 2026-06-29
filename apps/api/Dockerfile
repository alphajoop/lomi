# Build context: repository root (Railway loads `apps/api/Dockerfile` from monorepo root).
# Requires `apps/pi-spi-sdk` in the build context (enable Git submodules on Railway).
FROM node:22-bookworm-slim

RUN corepack enable \
    && corepack prepare pnpm@9.15.9 --activate

# api depends on pi-spi-sdk via file:../pi-spi-sdk → /pi-spi-sdk when WORKDIR is /app
COPY apps/pi-spi-sdk /pi-spi-sdk
WORKDIR /pi-spi-sdk
RUN pnpm install --frozen-lockfile \
    && pnpm run build

WORKDIR /app
COPY apps/api/package.json apps/api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src

RUN pnpm run build \
    && pnpm prune --prod

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "dist/main"]
