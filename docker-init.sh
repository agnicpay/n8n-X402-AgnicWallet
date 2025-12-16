#!/bin/sh
# Install package globally as root
npm install -g /tmp/package.tgz

# Also copy to custom extensions directory (n8n's preferred method)
mkdir -p /home/node/.n8n/custom
cp -r /usr/local/lib/node_modules/n8n-nodes-agnicwallet /home/node/.n8n/custom/ 2>/dev/null || true
chown -R node:node /home/node/.n8n/custom 2>/dev/null || true
chown -R node:node /usr/local/lib/node_modules/n8n-nodes-agnicwallet 2>/dev/null || true

# Switch to node user and start n8n
exec su - node -c "cd / && n8n start"

