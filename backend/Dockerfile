FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
# Padrão para Railway/VPS com volume em /data (Railway pode sobrescrever nas Variables)
ENV DATABASE_URL=file:/data/prod.db
RUN mkdir -p /data
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001
# Após migrate, garante tenant demo (upsert idempotente). Veja prisma/seed.ts e SKIP_DEMO_SEED.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SKIP_DEMO_SEED\" != \"true\" ]; then npx prisma db seed; fi && node dist/src/main.js"]
