FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/talentos/package.json ./artifacts/talentos/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/talentos/package.json ./artifacts/talentos/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @workspace/talentos run build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/talentos/dist/public ./dist/public
COPY --from=builder /app/artifacts/talentos/package.json ./package.json
USER appuser
EXPOSE 5173
CMD ["pnpm", "--filter", "@workspace/talentos", "run", "serve"]
