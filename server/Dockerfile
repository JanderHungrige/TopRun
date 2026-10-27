# TopGun online ladder service (doc 27). Build from the repo root:
#   docker build -f server/Dockerfile -t toprun-ladder .
# Node runs the TypeScript directly (type stripping); the runtime image has no npm dependencies.
ARG NODE_VERSION=24.19.0-alpine

FROM node:${NODE_VERSION} AS check
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY tsconfig.json tsconfig.server.json vite.config.ts ./
COPY src/game/ladder.ts src/game/ladder-cloud.ts src/game/rating.ts src/game/callsign.ts ./src/game/
COPY src/data/ranks.ts src/data/countries.ts ./src/data/
COPY server ./server
RUN npx tsc -p tsconfig.server.json && npx vitest run server

FROM node:${NODE_VERSION} AS runtime
LABEL org.opencontainers.image.source="https://github.com/JanderHungrige/TopRun" \
      org.opencontainers.image.description="TopGun online ladder service"
ENV NODE_ENV=production PORT=8090 LADDER_FILE=/data/ladder.json
WORKDIR /srv
# Only for "type": "module"; nothing is installed.
COPY package.json ./
COPY --from=check /app/src/game/ladder.ts /app/src/game/ladder-cloud.ts /app/src/game/rating.ts /app/src/game/callsign.ts ./src/game/
COPY --from=check /app/src/data/ranks.ts /app/src/data/countries.ts ./src/data/
COPY --from=check /app/server/ladder/main.ts /app/server/ladder/http.ts /app/server/ladder/cloud-http.ts /app/server/ladder/reply.ts /app/server/ladder/store.ts /app/server/ladder/log.ts ./server/ladder/
# A new named volume copies this directory, so the unprivileged user owns /data.
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8090/api/ladder/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/ladder/main.ts"]
