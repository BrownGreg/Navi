# Dockerfile — Next.js (racine du repo), frontend pur.
# Necessite `output: "standalone"` dans next.config.js.

# 1) Dependances
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Image finale, minimale
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Sans ceci, le serveur standalone Next.js peut n'ecouter qu'en loopback :
# le process demarre, Render detecte le port ouvert en interne, mais aucune
# requete externe (edge proxy) ne l'atteint jamais - symptome exact d'un 502
# permanent malgre un service qui se declare "live". Piege documente par
# l'exemple Docker officiel de Next.js.
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
