# ---- Build Stage ----
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend package files
COPY package.json package-lock.json ./

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm ci --production=false

# Copy all code
COPY . .

# Build frontend
RUN npm run build

# ---- Production Stage ----
FROM node:18-bullseye-slim
WORKDIR /app

# Copy frontend + backend package files
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

# Install production dependencies
RUN npm ci --production
RUN cd backend && npm ci --production

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/build ./build

# Environment variables
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

# Start backend server
CMD ["node", "backend/dist/server.js"]
