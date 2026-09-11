# Next.js + Payload 3 Multi-stage Dockerfile
FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the lockfile present
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else npm install; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Dummy fallback jika env tidak di-pass saat build time
ARG PAYLOAD_SECRET=dummy_secret_for_docker_build_only
ARG AUTH_SECRET=dummy_secret_for_docker_build_only
ARG DATABASE_URL=""
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

# 3. Production runner image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin aset public jika ada
COPY --from=builder /app/public ./public

# Setup folder cache .next dengan permission user non-root
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Salin hasil standalone Next.js build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
