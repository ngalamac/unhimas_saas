FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# copy and install deps
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# copy source and build
COPY . ./
RUN npm run build

FROM node:18-bullseye-slim
WORKDIR /app

# Production deps
COPY package.json package-lock.json* ./
RUN npm ci --production

# copy build output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "./dist/server.js"]
