# syntax=docker/dockerfile:1

# --- Compilación: necesita toolchain nativo para better-sqlite3 ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod

# --- Ejecución ---
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY docker-entrypoint.sh ./

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 3000
ENV DB_PATH=/app/data/tasks.sqlite

ENTRYPOINT ["./docker-entrypoint.sh"]
