# Build context must be the `apps/` directory (sibling of pi-spi-sdk), not `apps/api`.
# Railway: set Root Directory to `apps` and Dockerfile path to `api/Dockerfile`.
FROM node:22-bookworm-slim

RUN corepack enable \
    && corepack prepare pnpm@9.15.9 --activate

# api depends on pi-spi-sdk via file:../pi-spi-sdk → /pi-spi-sdk when WORKDIR is /app
COPY pi-spi-sdk /pi-spi-sdk
WORKDIR /pi-spi-sdk
RUN pnpm install --frozen-lockfile \
    && pnpm run build

WORKDIR /app
COPY api/package.json api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY api/nest-cli.json api/tsconfig.json api/tsconfig.build.json ./
COPY api/src ./src

RUN pnpm run build \
    && pnpm prune --prod

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "dist/main"]
