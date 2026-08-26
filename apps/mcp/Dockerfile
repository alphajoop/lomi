# production MCP HTTP server image (tests run in CI; image build stays slim)
# Build from monorepo root: docker build -f apps/mcp/Dockerfile .
# Railway must use root directory `/` and dockerfile path `apps/mcp/Dockerfile`.
FROM node:22-bookworm-slim

WORKDIR /app

# file: dependencies live outside apps/mcp and dist/ is gitignored.
COPY packages/shared ./packages/shared
COPY apps/sdks/scripts ./apps/sdks/scripts
COPY apps/mcp/package.json apps/mcp/pnpm-lock.yaml ./apps/mcp/

RUN corepack enable \
    && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app/packages/shared
RUN pnpm install \
    && pnpm exec tsc -p tsconfig.build.json

WORKDIR /app/apps/mcp
RUN pnpm install --frozen-lockfile

COPY apps/mcp/tsconfig.json ./
COPY apps/mcp/src ./src

RUN pnpm exec tsc \
    && pnpm prune --prod

ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333

CMD ["node", "dist/http-entry.js"]
