# ================================================================
# Dockerfile — MoneyTrack (Phase 1 — static frontend)
# ================================================================
#
# Multi-stage build explained:
#
#   Stage 1 "builder":
#     - Starts from a Node image
#     - In Phase 1 there's nothing to build (pure HTML/CSS/JS)
#     - We copy source files and run a lint/validate step
#     - This stage is DISCARDED after building — not in final image
#
#   Stage 2 "production":
#     - Starts from a tiny Nginx image (~25 MB vs ~900 MB for Node)
#     - Copies only the built output from Stage 1
#     - Contains ONLY what is needed to serve the app
#     - Final image is small, fast, and has no dev tools (more secure)
#
# Why this matters:
#   A developer's machine runs the same container as the production
#   server. "Works on my machine" problems disappear.
# ================================================================


# ── Stage 1: Builder ───────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"

WORKDIR /build

# Copy source files
COPY frontend/src/ ./src/

# In Phase 1 there's no npm install needed (no dependencies).
# In Phase 2+ this is where `npm ci && npm run build` will go.
# We run a basic check to confirm all expected files exist.
RUN echo "Checking required files..." && \
    test -f src/index.html  || (echo "ERROR: index.html missing"  && exit 1) && \
    test -f src/css/main.css || (echo "ERROR: main.css missing"   && exit 1) && \
    test -f src/js/utils.js  || (echo "ERROR: utils.js missing"   && exit 1) && \
    test -f src/js/storage.js|| (echo "ERROR: storage.js missing" && exit 1) && \
    test -f src/js/ui.js     || (echo "ERROR: ui.js missing"      && exit 1) && \
    test -f src/js/app.js    || (echo "ERROR: app.js missing"     && exit 1) && \
    echo "All files OK."


# ── Stage 2: Production ────────────────────────────────────────
FROM nginx:1.25-alpine AS production

LABEL maintainer="MoneyTrack"
LABEL description="MoneyTrack — personal expense tracker"
LABEL version="1.0.0"

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy our app files from the builder stage
COPY --from=builder /build/src/ /usr/share/nginx/html/

# Copy our custom Nginx config (replaces the default)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on port 80 inside the container.
# docker-compose.yml maps this to a port on your machine.
EXPOSE 80

# Nginx starts in the foreground (required for Docker).
# "daemon off" keeps the process alive so Docker doesn't think it crashed.
CMD ["nginx", "-g", "daemon off;"]
