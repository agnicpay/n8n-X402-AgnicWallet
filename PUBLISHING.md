# Publishing N8N AgnicWallet Node

## Current Status
✅ Package built successfully
✅ Repository URL updated
✅ Package.json configured
✅ Node works locally

## Publishing Options

### Option 1: NPM Package (Recommended First Step)

**Who can use it:** Anyone with self-hosted N8N
**Works on n8n.cloud:** ❌ No

#### Steps to Publish:

1. **Create NPM account** (if you don't have one)
   ```bash
   npm login
   ```

2. **Test the package locally**
   ```bash
   cd n8n-nodes-agnicwallet
   npm run build
   npm pack  # Creates a .tgz file
   ```

3. **Publish to NPM**
   ```bash
   npm publish
   ```

4. **Users install with:**
   ```bash
   npm install -g n8n-nodes-agnicwallet
   ```

#### Versioning
- Current version: `1.0.0`
- Update version in `package.json` for each release
- Follow semantic versioning: `MAJOR.MINOR.PATCH`

---

### Option 2: N8N Community Node (For n8n.cloud)

**Who can use it:** Everyone including n8n.cloud users
**Works on n8n.cloud:** ✅ Yes (after approval)

#### Requirements:

1. **Must be published to NPM first** ✅
2. **Follow N8N community node guidelines:**
   - Package name starts with `n8n-nodes-`
   - Has `n8n-community-node-package` keyword
   - Proper documentation
   - Example workflows
   - Tests (optional but recommended)

3. **Submit for review:**
   - Go to: https://github.com/n8n-io/n8n/issues
   - Create issue: "Add community node: n8n-nodes-agnicwallet"
   - Provide NPM link, docs, examples
   - Wait for N8N team review (can take weeks)

4. **After approval:**
   - Node appears in N8N's community nodes list
   - Users can install directly from N8N UI
   - Works on n8n.cloud

---

### Option 3: Self-Hosted N8N Deployment

**For your own production use**

#### Docker Compose Example:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=yourpassword
      - WEBHOOK_URL=https://your-domain.com/
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - ./n8n-data:/home/node/.n8n
      - ./n8n-nodes-agnicwallet:/home/node/.n8n/custom
    command: /bin/sh -c "cd /home/node/.n8n/custom && npm install && n8n start"
```

#### Railway/Render Deployment:

1. **Deploy N8N to Railway/Render**
2. **Install your node via startup command:**
   ```bash
   npm install -g n8n-nodes-agnicwallet && n8n start
   ```

3. **Or use custom Docker image:**
   ```dockerfile
   FROM n8nio/n8n:latest

   USER root

   # Install AgnicWallet node
   RUN npm install -g n8n-nodes-agnicwallet

   USER node
   ```

---

## Recommended Path

### Phase 1: NPM (Now)
1. ✅ Build completed
2. Create NPM account
3. Run `npm publish`
4. Share package link

### Phase 2: Community Node (Later)
1. Add example workflows
2. Add comprehensive README
3. Submit to N8N team
4. Wait for approval

### Phase 3: Production Deployment
1. Deploy self-hosted N8N
2. Install via NPM
3. Share with users

---

## Pre-Publishing Checklist

Before running `npm publish`:

- ✅ Build succeeds (`npm run build`)
- ✅ Package.json configured
- ✅ Repository URL correct
- ✅ License set (MIT)
- ⚠️ README.md in package root
- ⚠️ Test installation locally
- ⚠️ Decide on scope (publish as `@agnicwallet/n8n-nodes-agnicwallet`?)

---

## Testing the Package Before Publishing

1. **Build and pack:**
   ```bash
   npm run build
   npm pack
   ```

2. **Test install in another directory:**
   ```bash
   cd /tmp
   npm install /path/to/n8n-nodes-agnicwallet-1.0.0.tgz
   ```

3. **Test with N8N:**
   ```bash
   N8N_CUSTOM_EXTENSIONS=/tmp/node_modules/n8n-nodes-agnicwallet n8n start
   ```

---

## Post-Publishing

After `npm publish` succeeds:

1. **Tag the release in Git:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub release:**
   - Go to GitHub repo
   - Releases → New Release
   - Tag: v1.0.0
   - Title: "AgnicWallet N8N Node v1.0.0"
   - Description: Features, changes, install instructions

3. **Share:**
   - NPM link: `https://www.npmjs.com/package/n8n-nodes-agnicwallet`
   - Docs: Link to GitHub README
   - Examples: Share example workflows

---

## Updating the Package

For future updates:

1. **Make changes**
2. **Update version in package.json:**
   ```json
   "version": "1.0.1"  // Bug fix
   "version": "1.1.0"  // New feature
   "version": "2.0.0"  // Breaking change
   ```
3. **Build and publish:**
   ```bash
   npm run build
   npm publish
   ```
4. **Tag release:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

---

## Support & Documentation

- **NPM page:** Will auto-generate from README.md
- **GitHub:** Main documentation and issues
- **Examples:** Include example workflows in repo
- **Support:** Via GitHub issues

---

## Cost

- **NPM publishing:** FREE
- **N8N community node:** FREE
- **Self-hosted N8N:** Server costs only
- **n8n.cloud:** After community approval, users pay N8N subscription

---

## What Users Will Do

### With NPM package:
```bash
# Install N8N (if not already installed)
npm install -g n8n

# Install AgnicWallet node
npm install -g n8n-nodes-agnicwallet

# Start N8N
n8n start
```

### With community node (after approval):
1. Open N8N
2. Settings → Community Nodes
3. Search "AgnicWallet"
4. Click Install
5. Restart N8N

---

## Next Steps

**Ready to publish?**

1. Run `npm login` (create account at npmjs.com if needed)
2. Run `npm publish` from the `n8n-nodes-agnicwallet` directory
3. Share the NPM link: `https://www.npmjs.com/package/n8n-nodes-agnicwallet`

**Want to test more first?**

1. Run `npm pack` to create a .tgz file
2. Install locally to test
3. Ensure everything works
4. Then publish
