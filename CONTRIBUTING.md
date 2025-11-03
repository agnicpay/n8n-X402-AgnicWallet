# Contributing to n8n-nodes-agnicwallet

Thank you for your interest in contributing to the AgnicWallet n8n node! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/agnicpay/n8n-nodes-agnicwallet/issues/new) with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your n8n version and node version
- Any relevant error messages or logs

### Suggesting Features

We love new ideas! To suggest a feature:

1. Check if it's already been suggested in [Issues](https://github.com/agnicpay/n8n-nodes-agnicwallet/issues)
2. Open a new issue with the `enhancement` label
3. Describe the feature and why it would be useful
4. If possible, provide examples of how it would work

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/agnicpay/n8n-nodes-agnicwallet.git
   cd n8n-nodes-agnicwallet
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

5. **Test your changes**
   ```bash
   npm run build
   npm run format
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes clearly
   - Link any related issues

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- n8n installed (for testing)
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/n8n-nodes-agnicwallet.git
cd n8n-nodes-agnicwallet

# Install dependencies
npm install

# Build the node
npm run build

# Watch for changes during development
npm run dev
```

### Testing Locally with n8n

1. **Link the package locally:**
   ```bash
   npm link
   ```

2. **In your n8n installation, link the node:**
   ```bash
   cd ~/.n8n
   npm link n8n-nodes-agnicwallet
   ```

3. **Restart n8n:**
   ```bash
   n8n start
   ```

4. **Test your changes** in n8n's workflow editor

### Code Style

- Use TypeScript for all code
- Follow the existing formatting (use `npm run format`)
- Add JSDoc comments for public methods
- Keep functions small and focused

## Project Structure

```
n8n-nodes-agnicwallet/
├── nodes/                    # Node implementations
│   └── X402HttpRequest/
│       └── X402HttpRequest.node.ts
├── credentials/              # Credential types
│   ├── AgnicWalletApi.credentials.ts
│   └── AgnicWalletOAuth2Api.credentials.ts
├── dist/                     # Compiled output
├── package.json             # Package configuration
└── tsconfig.json            # TypeScript configuration
```

## Need Help?

- Check existing [Issues](https://github.com/agnicpay/n8n-nodes-agnicwallet/issues)
- Read the [n8n documentation](https://docs.n8n.io/integrations/creating-nodes/)
- Contact us at support@agnicpay.xyz

## Code of Conduct

Please note that this project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AgnicWallet! 🙏
