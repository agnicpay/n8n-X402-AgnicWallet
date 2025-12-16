# How to Update the Node After Code Changes

When you make changes to the node code, follow these steps to ensure the changes are reflected in your running n8n instance:

## Quick Update Steps

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Rebuild and restart Docker container:**
   ```bash
   ./dev-docker.sh
   ```

   This script will:
   - Build the TypeScript code
   - Create an npm package tarball
   - Stop the existing container
   - Start a new container with the updated package

3. **Refresh your browser:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear browser cache

## Alternative: Quick Restart (if only rebuilding)

If you just rebuilt and want to restart without rebuilding the package:

```bash
docker restart agnic-wallet-n8n
```

## Verify Changes

1. Check container logs:
   ```bash
   docker logs agnic-wallet-n8n | tail -20
   ```

2. Verify package is installed:
   ```bash
   docker exec agnic-wallet-n8n npm list -g | grep agnic
   ```

3. Check if node file was updated:
   ```bash
   docker exec agnic-wallet-n8n ls -lh /usr/local/lib/node_modules/n8n-nodes-agnicwallet/dist/nodes/
   ```

4. In n8n UI:
   - Add a new instance of the node
   - Check that the new properties/options appear

## Common Issues

### Changes not appearing in UI:
- **Solution**: Hard refresh browser (Cmd+Shift+R)
- **Solution**: Restart container: `docker restart agnic-wallet-n8n`

### Build errors:
- **Solution**: Check TypeScript errors: `npm run build`
- **Solution**: Clear dist folder and rebuild: `rm -rf dist && npm run build`

### Node not found:
- **Solution**: Verify package.json includes the node in `n8n.nodes` array
- **Solution**: Check package is installed: `docker exec agnic-wallet-n8n npm list -g | grep agnic`

## Development Workflow

For active development with hot-reload:

1. **Watch mode** (auto-rebuild on file changes):
   ```bash
   npm run dev
   ```

2. **In another terminal**, restart container when needed:
   ```bash
   docker restart agnic-wallet-n8n
   ```

## Complete Rebuild

If you suspect cache issues or need a completely fresh start:

```bash
# Stop and remove container
docker stop agnic-wallet-n8n
docker rm agnic-wallet-n8n

# Clean build
rm -rf dist node_modules/.cache
npm run build

# Reinstall and start
./dev-docker.sh
```

