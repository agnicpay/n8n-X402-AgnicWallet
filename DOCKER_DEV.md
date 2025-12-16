# Running in Local n8n Docker

This guide explains how to test the AgnicWallet nodes in your local n8n Docker instance.

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js and npm installed (for building the package)

## Method 1: Volume Mount (Recommended for Development)

This method mounts the built `dist` directory directly into your Docker container, so you can rebuild and restart the container to see changes.

### Step 1: Build the package

```bash
npm run build
```

This compiles TypeScript and copies icons to the `dist/` directory.

### Step 2: Run n8n with volume mount

#### Option A: Using docker run

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/dist:/home/node/.n8n/custom/n8n-nodes-agnicwallet \
  n8nio/n8n:latest
```

#### Option B: Using docker-compose

Create a `docker-compose.dev.yml` file:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-dev
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
      # Custom nodes directory
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    volumes:
      - ~/.n8n:/home/node/.n8n
      # Mount the built dist directory
      - ./dist:/home/node/.n8n/custom/n8n-nodes-agnicwallet
```

Then run:

```bash
docker-compose -f docker-compose.dev.yml up
```

#### Option C: Using n8n's custom nodes directory

n8n looks for custom nodes in a specific directory structure. You can mount your dist folder:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/dist:/home/node/.n8n/custom \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  n8nio/n8n:latest
```

However, this requires the directory structure to match what n8n expects. A better approach is to install it as a proper npm package inside the container.

### Step 3: Access n8n

Open your browser to `http://localhost:3006` (or the port you configured) and you should see:
- **AgnicWallet X402 Request** node
- **AgnicAI Language Model** node

**Note**: The default configuration uses port `3006` and container name `agnic-wallet-n8n` to distinguish it from other n8n instances.

## Method 2: Install as Local npm Package (Better for Development)

This method installs the package properly in the container.

### Step 1: Build the package

```bash
npm run build
```

### Step 2: Create a local package tarball

```bash
npm pack
```

This creates a file like `n8n-nodes-agnicwallet-1.0.6.tgz`

### Step 3: Mount and install in container

Create a `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-dev
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./n8n-nodes-agnicwallet-*.tgz:/tmp/package.tgz:ro
    command: >
      sh -c "
        npm install -g /tmp/package.tgz &&
        n8n start
      "
```

Then run:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Method 3: Custom Dockerfile (For Production-like Testing)

Create a `Dockerfile.dev`:

```dockerfile
FROM n8nio/n8n:latest

USER root

# Copy the built package
COPY dist /tmp/n8n-nodes-agnicwallet
COPY package.json /tmp/n8n-nodes-agnicwallet/package.json

# Install the package
RUN cd /tmp/n8n-nodes-agnicwallet && \
    npm install --production && \
    npm pack && \
    npm install -g n8n-nodes-agnicwallet-*.tgz && \
    rm -rf /tmp/n8n-nodes-agnicwallet

USER node
```

Build and run:

```bash
npm run build
docker build -f Dockerfile.dev -t n8n-with-agnicwallet .
docker run -it --rm -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8n-with-agnicwallet
```

## Method 4: Direct Volume Mount (Simplest for Quick Testing)

If you just want to quickly test and don't need proper npm installation:

### Step 1: Build

```bash
npm run build
```

### Step 2: Run with bind mount

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/dist:/tmp/n8n-nodes-agnicwallet:ro \
  -e N8N_CUSTOM_EXTENSIONS=/tmp \
  n8nio/n8n:latest
```

**Note**: This may not work perfectly because n8n expects custom nodes to be installed as npm packages. Method 2 or 3 are more reliable.

## Recommended Development Workflow

1. **Make changes** to your node code
2. **Rebuild**: `npm run build`
3. **Restart Docker container** (or use the watch mode with volume mount)

For hot-reload during development, you can use:

```bash
npm run dev
```

This runs TypeScript in watch mode, automatically recompiling on file changes. Then restart the Docker container to pick up the changes.

## Troubleshooting

### Nodes don't appear in n8n

1. Check that the build succeeded: `ls -la dist/nodes/`
2. Verify the package.json structure in dist
3. Check Docker logs: `docker logs n8n`
4. Ensure volumes are mounted correctly

### Credentials not working

1. Make sure credentials are set up in n8n UI
2. Check that credential names match: `agnicWalletOAuth2Api` and `agnicWalletApi`
3. Verify OAuth2 callback URL is correct

### Permission errors

If you see permission errors, the container user might not have access. Try:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/dist:/custom/n8n-nodes-agnicwallet \
  --user root \
  n8nio/n8n:latest sh -c "chown -R node:node /custom && su - node -c 'n8n start'"
```

## Quick Start Script

Use the provided `dev-docker.sh` script:

```bash
./dev-docker.sh
```

This script will:
- Build the package
- Create an npm package tarball
- Start a Docker container named `agnic-wallet-n8n` on port `3006`
- Install and run n8n with your AgnicWallet nodes

Access n8n at: http://localhost:3006

View logs with: `docker logs -f agnic-wallet-n8n`
Stop with: `docker stop agnic-wallet-n8n`

**Note**: The container name is `agnic-wallet-n8n` and runs on port `3006` to help distinguish it from other n8n instances you may be running.

