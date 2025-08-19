# Multi-stage build para optimizar el tamaño final
FROM node:18-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Variables de build (inyectadas desde docker-compose)
ARG NODE_ENV=production
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_CACHE_VERSION
ARG VITE_GA_TRACKING_ID
ARG VITE_HOTJAR_ID
ARG VITE_SENTRY_DSN
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_APP_DESCRIPTION
ARG VITE_SUPABASE_EDGE_BASE_URL
ARG VITE_META_APP_ID
ARG VITE_META_APP_SECRET
ARG VITE_META_VERIFY_TOKEN
ARG VITE_META_GRAPH_VERSION

# Exportarlas al entorno para que Vite las lea en el build
ENV NODE_ENV=$NODE_ENV \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_APP_CACHE_VERSION=$VITE_APP_CACHE_VERSION \
    VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID \
    VITE_HOTJAR_ID=$VITE_HOTJAR_ID \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_APP_DESCRIPTION=$VITE_APP_DESCRIPTION \
    VITE_SUPABASE_EDGE_BASE_URL=$VITE_SUPABASE_EDGE_BASE_URL \
    VITE_META_APP_ID=$VITE_META_APP_ID \
    VITE_META_APP_SECRET=$VITE_META_APP_SECRET \
    VITE_META_VERIFY_TOKEN=$VITE_META_VERIFY_TOKEN \
    VITE_META_GRAPH_VERSION=$VITE_META_GRAPH_VERSION

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml* ./

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN pnpm build

# Etapa de producción con Nginx
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos construidos desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Cambiar permisos
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d

# Crear directorios necesarios
RUN touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]