# ---- Build Stage ----
FROM node:18-bullseye-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:18-bullseye-slim
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Render will inject $PORT at runtime
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "./dist/server.js"]
