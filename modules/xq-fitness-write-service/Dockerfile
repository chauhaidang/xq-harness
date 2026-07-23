# syntax=docker/dockerfile:1.7

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache bash openjdk17-jre

# Generate the local file dependency before the clean install. Registry
# credentials come from a BuildKit secret and never from the source tree.
COPY package.json package-lock.json openapitools.json ./
COPY api/write-service-api.yaml ./api/write-service-api.yaml
COPY scripts/generate-api-client.sh ./scripts/generate-api-client.sh
RUN --mount=type=secret,id=GITHUB_TOKEN,required=true \
  printf '@chauhaidang:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/GITHUB_TOKEN)" > /tmp/xq-npmrc \
  && NPM_CONFIG_USERCONFIG=/tmp/xq-npmrc bash ./scripts/generate-api-client.sh write-service \
  && NPM_CONFIG_USERCONFIG=/tmp/xq-npmrc npm ci \
  && rm -f /tmp/xq-npmrc

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:22-alpine

LABEL org.opencontainers.image.title="xq-fitness-write-service" \
  org.opencontainers.image.description="Unified read and write API for XQ Fitness"

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules and built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check (using /health endpoint, not /api/v1/health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["node", "dist/src/index.js"]
