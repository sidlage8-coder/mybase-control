# ============================================
# DOCKERFILE OPTIMISÉ POUR NEXT.JS STANDALONE
# Déploiement sur Coolify/Docker
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# ============================================
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les dépendances depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de l'application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers publics
COPY --from=builder /app/public ./public

# Créer le dossier .next et définir les permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copier le build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Passer à l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
