# Stage 1: Build the frontend bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm ci

# Copy application source
COPY index.html ./
COPY vite.config.mjs ./
COPY src/ ./src/

# Build static production bundle
RUN npm run build

# Stage 2: Minimal production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DOCUMENTS_DIR=/app/documents
ENV DATA_DIR=/app/data

# Copy dependency files
COPY package*.json ./

# Install only production dependencies (skips Electron, Vite, electron-builder)
RUN npm ci --omit=dev

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server/ ./server/

# Create persistent storage directories
RUN mkdir -p /app/documents /app/data

# Declare mountable volumes for persistence
VOLUME ["/app/documents", "/app/data"]

EXPOSE 3000

# Start Markdown Studio Web backend
CMD ["node", "server/server.js"]
