# syntax=docker/dockerfile:1

# ---- Dependencies (cached layer, production only) -------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Development (used by docker-compose.dev.yml) -------------------------
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm install -g nodemon
ENV NODE_ENV=development
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Production -----------------------------------------------------------
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Non-root: use the unprivileged `node` user that ships with the image.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/app.js"]
