# ==============================================================================
# StarTip Frontend Dockerfile (Supports Development & Production Targets)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base with dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit

# ------------------------------------------------------------------------------
# Target: development (Vite Hot-Reload Server on Port 5173)
# ------------------------------------------------------------------------------
FROM base AS development
COPY . .
EXPOSE 5173
ENV PORT=5173
CMD ["npm", "run", "dev"]

# ------------------------------------------------------------------------------
# Stage 2: Production Build
# ------------------------------------------------------------------------------
FROM base AS builder
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Target: production (Nginx Static Server on Port 80)
# ------------------------------------------------------------------------------
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
