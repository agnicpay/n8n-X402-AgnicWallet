# Fix: Nodes Not Being Discovered by n8n

## Issue
The AgnicWallet nodes are installed correctly (`npm install -g` shows them), but n8n's API (`/rest/node-types`) doesn't return them, meaning n8n isn't discovering them.

## Root Cause
n8n may not be scanning global node_modules in Docker containers, or there's a timing/permission issue.

## Potential Solutions to Try

### Solution 1: Use n8n's Custom Extensions Directory (Recommended)
Instead of global npm install, copy the package to n8n's custom directory:

```bash
# In docker-init.sh, after npm install -g:
mkdir -p /home/node/.n8n/custom/n8n-nodes-agnicwallet
cp -r /usr/local/lib/node_modules/n8n-nodes-agnicwallet/* /home/node/.n8n/custom/n8n-nodes-agnicwallet/
chown -R node:node /home/node/.n8n/custom
```

And set environment variable:
```bash
-e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
```

### Solution 2: Install in User Directory
Install the package in the node user's local directory:

```bash
su - node -c "npm install -g /tmp/package.tgz"
```

### Solution 3: Use Volume Mount (Development)
Mount the dist directory directly:

```bash
-v $(pwd)/dist:/home/node/.n8n/custom/n8n-nodes-agnicwallet
```

### Solution 4: Check n8n Version Compatibility
Some n8n versions have issues with community node discovery. Verify version 1.121.2 supports it.

### Solution 5: Manual Node Registration
If n8n has an API to register nodes manually, use that.

## Current Status
- ✅ Package installed: `/usr/local/lib/node_modules/n8n-nodes-agnicwallet`
- ✅ Files exist and are loadable
- ✅ Package.json structure is correct
- ❌ n8n API doesn't return the nodes
- ❌ Nodes don't appear in UI

## Next Steps
Try Solution 1 first (custom extensions directory approach).

