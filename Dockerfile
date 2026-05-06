# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Install ffmpeg + the system libraries Remotion's headless Chromium needs.
# Without these libs the renderer fails to launch on a slim container.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (devDeps included so `npm run build` can run typecheck).
# Using `npm install` so the build works without a committed package-lock.json.
# Once the first deploy succeeds, commit the generated lockfile and switch to
# `npm ci` for reproducible builds.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source
COPY . .

# Typecheck
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
