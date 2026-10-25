# TopRun — static build served by unprivileged nginx. Put your reverse proxy (TLS) in front of port 8080.
ARG NODE_VERSION=24.19.0-alpine
ARG NGINX_VERSION=1.30.6-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY tests ./tests
RUN npm test && npm run build

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runtime
LABEL org.opencontainers.image.source="https://github.com/JanderHungrige/TopRun" \
      org.opencontainers.image.description="TopRun — carrier launch and top-down arcade shooter (static web game)"
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8081/health || exit 1
# Base image already runs as the unprivileged "nginx" user (uid 101) and uses exec-form CMD.
