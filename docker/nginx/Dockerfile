# syntax=docker/dockerfile:1
# Build context: a repó gyökere (lásd a gyökér .dockerignore allowlistjét).

FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS spa

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY frontend/ ./
RUN npm run build

FROM nginx:1.30.7-alpine3.24@sha256:bef154735288bc38d99fac41ae63730684bcc661503673a04a0f9bc526ba8598 AS prod

# Javított libxml2 (CVE-2026-86144, HIGH): az alap-image még a sérülékeny 2.13.9-r2-t tartalmazza.
# Az alap-image újabb digestre cserélésekor ez a sor elhagyható.
RUN apk upgrade --no-cache libxml2

# Nem root futtatás: a pid fájl és a cache az nginx felhasználó által írható helyre kerül, a port 8080.
RUN sed -i 's,^pid .*;,pid /tmp/nginx.pid;,' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx

# A publikált webhelyek helye (futáskor kötet csatlakozik rá).
RUN mkdir -p /var/www/sites

COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
COPY --from=spa /app/dist /var/www/frontend
COPY backend/public /var/www/backend/public

USER nginx
EXPOSE 8080
