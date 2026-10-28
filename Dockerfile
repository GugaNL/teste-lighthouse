# Um container só: o backend serve a API e o SPA no mesmo host e porta.
#
# Mesmo desenho dos outros projetos Codex — um serviço, um domínio, sem CORS
# nem proxy reverso para configurar no deploy.

# ─── Etapa 1: build do frontend ───────────────────────────────────────────────
FROM node:22-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Etapa 2: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# O app.js procura o build aqui (ver FRONTEND_DIR).
COPY --from=frontend /app/frontend/dist /app/frontend

ENV FRONTEND_DIR=/app/frontend
EXPOSE 4008

# Sem root dentro do container.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://localhost:4008/health || exit 1

CMD ["node", "src/server.js"]
