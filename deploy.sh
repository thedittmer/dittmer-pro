#!/usr/bin/env bash
set -e

#──────────────────────────────────────────────────
# Configure these for your project
#──────────────────────────────────────────────────
PROJECT_NAME="dittmer"
APP_PORT=3009
SERVER="neosho"
#──────────────────────────────────────────────────

REMOTE_DIR="sites/${PROJECT_NAME}/app"

echo "Deploying ${PROJECT_NAME}..."

# Build with production env vars (PUBLIC_ vars are baked in at build time)
if [ -f .env.production ]; then
    cp .env .env.dev.bak
    cp .env.production .env
fi

pnpm build

if [ -f .env.dev.bak ]; then
    mv .env.dev.bak .env
fi

# Sync build output and package files
rsync -avz --delete build/ ${SERVER}:~/${REMOTE_DIR}/build/
rsync -avz package.json pnpm-lock.yaml ${SERVER}:~/${REMOTE_DIR}/

# Sync runtime dependencies that aren't bundled by Vite
ssh ${SERVER} "mkdir -p ~/${REMOTE_DIR}/node_modules"
rsync -avz node_modules/pocketbase/ ${SERVER}:~/${REMOTE_DIR}/node_modules/pocketbase/
rsync -avz node_modules/fathom-client/ ${SERVER}:~/${REMOTE_DIR}/node_modules/fathom-client/
rsync -avz node_modules/svelte-dnd-action/ ${SERVER}:~/${REMOTE_DIR}/node_modules/svelte-dnd-action/
rsync -avz node_modules/three/ ${SERVER}:~/${REMOTE_DIR}/node_modules/three/
rsync -avz node_modules/marked/ ${SERVER}:~/${REMOTE_DIR}/node_modules/marked/

# Restart via systemd so the new build is actually picked up.
ssh ${SERVER} "sudo systemctl restart ${PROJECT_NAME}-app"

echo "Waiting for app to restart..."
sleep 5

# Verify the app came back up
ssh ${SERVER} "curl -sf -o /dev/null http://localhost:${APP_PORT}/ && echo 'App is up!' || echo 'WARNING: App did not come back up'"

echo "Deployed!"
