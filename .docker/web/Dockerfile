FROM node:24-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY web/package*.json ./
RUN npm install

COPY web/ .

EXPOSE 3000

# dev:docker (webpack, not the default Turbopack) so WATCHPACK_POLLING actually works - Turbopack's
# Rust file watcher doesn't honor it, and native fs events don't reliably cross the Windows/macOS
# Docker Desktop bind-mount bridge. See docs/COMMANDS.md.
CMD ["npm", "run", "dev:docker"]
