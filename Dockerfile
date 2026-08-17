FROM node:24-alpine AS builder

WORKDIR /app

# Set npm resilience timeouts for slow network connections
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000

# Install dependencies using layer caching
COPY package*.json ./
RUN npm ci

# Copy sources and build React application
COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js components.json index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

# Production Runner
FROM node:24-alpine

WORKDIR /app

# The runtime server (server.js) only requires express (SQLite is built-in node:sqlite)
RUN npm config set fetch-retries 5 && npm install --no-package-lock express

COPY server.js ./
COPY public ./public
COPY --from=builder /app/dist ./dist

# Volume for SQLite database persistence
VOLUME /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
