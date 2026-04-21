# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

ARG ANGULAR_CONFIGURATION=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration ${ANGULAR_CONFIGURATION}

# Runtime stage
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/enrichment-service-ui/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
