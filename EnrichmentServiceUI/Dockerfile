# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

ARG ANGULAR_CONFIGURATION=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration ${ANGULAR_CONFIGURATION}

# Runtime stage
FROM node:24-alpine AS runtime
WORKDIR /app

COPY server.js ./server.js
COPY --from=builder /app/dist/enrichment-service-ui/browser ./dist

EXPOSE 80
CMD ["node", "server.js"]
