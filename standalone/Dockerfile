# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then \
      NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --ignore-scripts --no-audit --no-fund; \
    else npm ci --ignore-scripts --no-audit --no-fund; fi
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 JUDY_DATA_DIR=/app/data
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/worker ./worker
COPY --from=build --chown=node:node /app/standalone ./standalone
RUN mkdir -p /app/data && chown node:node /app/data && chmod 700 /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node","standalone/server.mjs"]
