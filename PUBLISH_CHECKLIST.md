# NPM Publishing Checklist

## Before You Publish

### 1. NPM Account Setup
- [ ] Created NPM account at https://www.npmjs.com/signup
- [ ] Verified email address
- [ ] (Optional) Enabled 2FA for security

### 2. Package Name Check
- [ ] Package name: `n8n-nodes-agnicwallet`
- [ ] Check if name is available: https://www.npmjs.com/package/n8n-nodes-agnicwallet

### 3. Version
- [ ] Current version: `1.0.0`
- [ ] Increment for future updates: `npm version patch/minor/major`

### 4. Build Status
- [ ] ✅ `npm run build` succeeded
- [ ] ✅ `npm pack --dry-run` succeeded
- [ ] ✅ All files included (8 files, 7.7 KB)

## Publishing Steps

### Step 1: Login to NPM

```bash
npm login
```

You'll be prompted for:
- **Username**: Your NPM username
- **Password**: Your NPM password
- **Email**: (public)
- **OTP**: (if 2FA enabled)

### Step 2: Publish

```bash
npm publish
```

If you want to test first without actually publishing:
```bash
npm publish --dry-run
```

### Step 3: Verify

Check your package is live:
```bash
npm view n8n-nodes-agnicwallet
```

Or visit:
https://www.npmjs.com/package/n8n-nodes-agnicwallet

## After Publishing

### 1. Test Installation

In a new directory:
```bash
npm install n8n-nodes-agnicwallet
```

### 2. Tag Git Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 3. Create GitHub Release

Go to: https://github.com/agnicpay/agnicwallet-project/releases/new

- **Tag**: v1.0.0
- **Title**: n8n-nodes-agnicwallet v1.0.0
- **Description**:
  ```
  First stable release of AgnicWallet N8N node!

  ## Features
  - X402 HTTP Request with automatic blockchain payments
  - OAuth2 and API Key authentication
  - Usable as AI Agent tool
  - ChatGPT integration example

  ## Installation
  npm install -g n8n-nodes-agnicwallet
  ```

### 4. Share!

- Twitter/X
- N8N Community Forum
- Discord/Slack channels
- Your website

## Troubleshooting

### "Package name already taken"
- Choose a different name or add scope: `@your-org/n8n-nodes-agnicwallet`
- Update `package.json` name field
- Rebuild and republish

### "Need to authenticate"
- Run `npm login` again
- Check credentials
- Verify email if new account

### "403 Forbidden"
- Package might be owned by someone else
- Try a scoped package: `@agnicpay/n8n-nodes-agnicwallet`

### "Files missing in package"
- Check `package.json` `files` field
- Make sure `dist/` folder exists
- Run `npm pack` to preview

## Future Updates

### Patch Version (Bug fix): 1.0.0 → 1.0.1
```bash
npm version patch
npm publish
git push --tags
```

### Minor Version (New feature): 1.0.0 → 1.1.0
```bash
npm version minor
npm publish
git push --tags
```

### Major Version (Breaking change): 1.0.0 → 2.0.0
```bash
npm version major
npm publish
git push --tags
```

## Useful Commands

```bash
# Check who you're logged in as
npm whoami

# View package info
npm view n8n-nodes-agnicwallet

# List all versions
npm view n8n-nodes-agnicwallet versions

# Unpublish (within 72 hours, use carefully!)
npm unpublish n8n-nodes-agnicwallet@1.0.0

# Deprecate a version (recommended over unpublish)
npm deprecate n8n-nodes-agnicwallet@1.0.0 "Please upgrade to 1.0.1"
```

## Success Criteria

- [ ] Package appears on NPM
- [ ] Can install with `npm install -g n8n-nodes-agnicwallet`
- [ ] Works in N8N when installed
- [ ] Shows up as AI tool (with `usableAsTool: true`)
- [ ] All credentials work (OAuth2 + API Key)
- [ ] Documentation is accurate

## Support

- **Issues**: https://github.com/agnicpay/agnicwallet-project/issues
- **Docs**: https://github.com/agnicpay/agnicwallet-project
- **NPM**: https://www.npmjs.com/package/n8n-nodes-agnicwallet
