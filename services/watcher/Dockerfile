FROM node:22-alpine AS base

# Create pruning structure
FROM base AS builder
ENV DO_NOT_TRACK=1
WORKDIR /app
COPY . .

RUN npx turbo prune @blokbustr/watcher --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
ENV DO_NOT_TRACK=1

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
#RUN corepack enable
RUN npm install -g pnpm@9.12.3

WORKDIR /app

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .

RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm run build --filter=@blokbustr/watcher

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app
USER app

# Copy service files
COPY --from=installer --chown=app:nodejs /app ./

CMD node services/watcher/dist/index.js
