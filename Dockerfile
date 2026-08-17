FROM node:24-alpine AS builder

WORKDIR /app

# Copy configuration and sources
COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js components.json index.html ./
COPY src ./src
COPY public ./public

# Install all dependencies and build React client
RUN npm ci
RUN npm run build

# Production Runner
FROM node:24-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public
COPY --from=builder /app/dist ./dist

# Volume for SQLite database persistence
VOLUME /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
