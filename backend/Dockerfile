# ==============================================================================
# Multi-stage Dockerfile for Apollo GraphQL ECS Fargate Container
# Using Node.js v24 Alpine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build TypeScript artifacts
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Container Runtime
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner

# Install curl for container health checks
RUN apk add --no-cache curl

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=4000

# Copy production node_modules & compiled JS from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Use non-root node user for enterprise container security
USER node

EXPOSE 4000

# Health check matching ECS Fargate target group specification
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
