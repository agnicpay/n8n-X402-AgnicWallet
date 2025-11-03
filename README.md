# n8n-nodes-agnicwallet

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-agnicwallet)](https://www.npmjs.com/package/n8n-nodes-agnicwallet)
[![License](https://img.shields.io/npm/l/n8n-nodes-agnicwallet)](https://www.npmjs.com/package/n8n-nodes-agnicwallet)
[![GitHub issues](https://img.shields.io/github/issues/agnicpay/n8n-X402-AgnicWallet)](https://github.com/agnicpay/n8n-X402-AgnicWallet/issues)
[![GitHub stars](https://img.shields.io/github/stars/agnicpay/n8n-X402-AgnicWallet)](https://github.com/agnicpay/n8n-X402-AgnicWallet/stargazers)

N8N community node for AgnicWallet - automated Web3 payments for X402-enabled APIs.

> ⭐ If you find this node useful, please star the repository on [GitHub](https://github.com/agnicpay/n8n-X402-AgnicWallet)!

Make HTTP requests to X402-enabled APIs with automatic blockchain payment handling via AgnicWallet. No manual wallet management, no complex crypto operations - just authenticate and automate.

## What is X402?

[X402](https://www.x402.org/) is an open standard for HTTP-based payments. APIs return a `402 Payment Required` status with payment details, and your wallet automatically handles the payment to unlock the resource.

## What is AgnicWallet?

AgnicWallet is a non-custodial Web3 wallet service that handles blockchain payments automatically. Connect once, then all X402 payments happen seamlessly in the background.

## Features

- ✅ **Automatic X402 payment handling** - No manual wallet interactions
- ✅ **OAuth2 authentication** - Secure connection to your AgnicWallet
- ✅ **API Key support** - For programmatic access and CI/CD
- ✅ **Multiple HTTP methods** - GET, POST, PUT, DELETE
- ✅ **Custom headers** - Add any headers your API needs
- ✅ **JSON body support** - For POST/PUT requests
- ✅ **Payment metadata** - See exactly what you paid and when
- ✅ **Monthly spending limits** - Built-in safety controls
- ✅ **Multi-chain support** - Base (EVM) and Solana networks, both testnet and mainnet

## Installation

### For self-hosted N8N:

```bash
npm install -g n8n-nodes-agnicwallet
```

Then restart N8N:

```bash
n8n start
```

### For Docker:

Add to your Dockerfile:

```dockerfile
FROM n8nio/n8n:latest

USER root
RUN npm install -g n8n-nodes-agnicwallet
USER node
```

### For n8n.cloud:

Not yet available. This node must first be approved as a community node by the N8N team.

## Setup

### 1. Create AgnicWallet Account

1. Go to [AgnicWallet](https://app.agnicpay.xyz)
2. Sign up with email/social login
3. Your embedded wallet is created automatically

### 2. Connect to N8N

#### Option A: OAuth2 (Recommended)

1. In N8N, add the **AgnicWallet X402 Request** node
2. Select **OAuth2** authentication
3. Click **Connect my account**
4. Authorize AgnicWallet in the popup
5. Done! Your wallet is connected

#### Option B: API Key

1. Log in to [AgnicWallet](https://app.agnicpay.xyz)
2. Go to **Settings** → **API Tokens**
3. Generate a new token
4. In N8N, select **API Key** authentication
5. Paste your token
6. Done!

## Usage

### Basic Example: X402 Protected Content

Simple GET request with automatic payment:

- **Method:** `GET`
- **URL:** `https://www.x402.org/protected`

**What happens:**
1. Node makes GET request to protected endpoint
2. Receives `402 Payment Required` with payment details
3. Automatically signs payment ($0.01 USDC) with your AgnicWallet
4. Retries request with payment proof
5. Returns protected content with payment metadata

**Response:**
```json
{
  "data": "<!DOCTYPE html>...<h1>Protected Content</h1><p>Your payment was successful!...</p>",
  "_agnicWallet": {
    "paymentMade": true,
    "amountPaid": 0.01,
    "timestamp": "2025-10-28T13:46:44.079Z"
  }
}
```

### Advanced Example: ChatGPT with X402

For POST requests with JSON body, see the advanced integration example in the documentation.

### Example: Dynamic Content

Use N8N expressions for dynamic requests:

- **Body:**
  ```json
  {
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "{{ $json.userMessage }}"}
    ]
  }
  ```

This pulls the message from previous nodes in your workflow.

## Configuration Options

### Authentication
- **OAuth2** (recommended) - Secure account connection
- **API Key** - For automation and CI/CD

### HTTP Methods
- GET
- POST
- PUT
- DELETE

### Headers
Add multiple custom headers as key-value pairs

### Body (POST/PUT only)
JSON body for sending data to the API

## How It Works

1. **Make request** - Node sends HTTP request to X402 API
2. **Check for 402** - If API returns `402 Payment Required`, node extracts payment details
3. **Sign payment** - Node calls AgnicWallet backend to sign payment with your wallet
4. **Retry request** - Node retries with `X-PAYMENT` header containing payment proof
5. **Return response** - API validates payment and returns protected resource

## Backend Service

This node requires the AgnicWallet backend API to function. **This is by design and secure.**

### How It Works
1. You create a free account at [AgnicWallet](https://app.agnicpay.xyz)
2. You authorize n8n to use your wallet (OAuth2 or API Key)
3. When making X402 requests, the node calls `api.agnicpay.xyz` to sign payments on your behalf
4. Your wallet is non-custodial (keys managed securely, not stored by AgnicWallet)

### Why This Architecture?
- **No blockchain complexity** - You don't manage private keys or gas fees
- **Automatic payments** - Sign once, automate forever
- **Spending controls** - Set monthly limits for safety
- **Standard pattern** - Just like Slack, Notion, and other n8n nodes that use external APIs

### Backend API Details
- **Hosted at:** `api.agnicpay.xyz` (free to use)
- **Authentication:** OAuth2 or API Key
- **What it does:** Signs X402 payments with your authorized wallet
- **Open source:** You can self-host by setting `AGNICWALLET_API_URL` environment variable

This is the same architecture used by most n8n community nodes that interact with external services.

## Payment Details

- **Network:** Base Sepolia (testnet)
- **Token:** USDC
- **Typical cost:** $0.01 per request
- **Monthly limit:** $100 (configurable)
- **Payment method:** EIP-3009 TransferWithAuthorization (gasless)

## Security

- **Non-custodial** - Your keys, your crypto
- **OAuth2** - Industry-standard authentication
- **Spending limits** - Monthly caps prevent overspending
- **Payment review** - See all payments in AgnicWallet dashboard
- **Revocable access** - Disconnect N8N anytime

## FAQ

### Is my wallet safe?
Yes! AgnicWallet is non-custodial. Your private keys are managed securely using industry-standard key management infrastructure, never stored on AgnicWallet servers. The backend only signs transactions you've authorized.

### Do I need to trust AgnicWallet?
Yes, but only as much as you trust Slack, Notion, or Google when using their n8n nodes. You're authorizing AgnicWallet to sign X402 payments on your behalf within your spending limits.

### Can I use this node without AgnicWallet?
No. This node is specifically designed to work with AgnicWallet's backend API. However, you can:
- Fork this node and modify it to use your own payment service
- Self-host the AgnicWallet backend (set `AGNICWALLET_API_URL` environment variable)

### Is the backend API free?
Yes! The AgnicWallet service is free to use. You only pay blockchain transaction costs (USDC payments).

### What if api.agnicpay.xyz goes down?
- Your workflows will fail with payment signing errors
- Advanced users can self-host the backend for redundancy
- Check status at https://app.agnicpay.xyz

### Can n8n approve a node with external dependencies?
Absolutely! Most popular n8n community nodes depend on external APIs:
- Slack → api.slack.com
- GitHub → api.github.com
- Stripe → api.stripe.com
- AgnicWallet → api.agnicpay.xyz ✅

This is standard practice and well-documented in the node's README.

## Troubleshooting

### "Payment signing failed"

**Causes:**
- AgnicWallet credentials not connected
- Insufficient USDC balance
- Backend server down

**Solutions:**
1. Reconnect credentials in N8N
2. Check balance at [AgnicWallet](https://app.agnicpay.xyz)
3. Check backend status

### "Request failed after payment"

**Causes:**
- Invalid URL
- Wrong headers
- Malformed JSON body

**Solutions:**
1. Verify URL is correct
2. Check required headers for the API
3. Validate JSON syntax

### "Body field not visible"

The body field only appears when Method is **POST** or **PUT**. For GET requests, no body is shown (HTTP standard).

## Examples & Workflows

For example workflows and advanced use cases, check the documentation included with this package.

## API Reference

### Node Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| authentication | options | Yes | OAuth2 or API Key |
| method | options | Yes | HTTP method |
| url | string | Yes | X402 API endpoint |
| headers | collection | No | Custom headers |
| body | json | No* | JSON body (*POST/PUT only) |

## Supported Networks

AgnicWallet supports multiple blockchain networks for X402 payments:

- ✅ **Base Sepolia** - EVM testnet (free testing with testnet USDC)
- ✅ **Base** - EVM mainnet (real USDC payments)
- ✅ **Solana Devnet** - SVM testnet (free testing with devnet USDC)
- ✅ **Solana** - SVM mainnet (real USDC payments)

The node automatically selects the appropriate network based on your API token configuration and the X402 payment requirements from the API provider.

## Limitations

- **Body types:** JSON only (form-encoded coming soon)
- **Query params:** Use in URL for now (dedicated field coming soon)

## Contributing

Contributions are welcome! We appreciate bug reports, feature requests, and pull requests.

- **Bug reports & feature requests:** [Open an issue](https://github.com/agnicpay/n8n-X402-AgnicWallet/issues)
- **Pull requests:** See our [Contributing Guide](CONTRIBUTING.md)
- **Questions:** Contact us at support@agnicpay.xyz

## Support

- **X402 Standard:** [x402.org](https://www.x402.org/)
- **AgnicWallet:** [Dashboard](https://app.agnicpay.xyz)

## License

MIT License

## Links

- [NPM Package](https://www.npmjs.com/package/n8n-nodes-agnicwallet)
- [AgnicWallet Dashboard](https://app.agnicpay.xyz)
- [X402 Protocol](https://www.x402.org/)
- [N8N Documentation](https://docs.n8n.io)

## Roadmap

### ✅ Completed
- Multi-chain support (Base EVM + Solana SVM)
- OAuth2 and API Key authentication
- Mainnet and testnet support for both chains

### v1.1.0 (Next)
- Query parameters support
- Form-encoded body
- Timeout configuration

### v1.2.0 (Future)
- Additional EVM networks (Polygon, Arbitrum, etc.)
- Retry logic with exponential backoff
- Enhanced rate limiting

### v2.0.0
- File upload support
- Streaming responses
- Webhook triggers

## Acknowledgments

Built with:
- [N8N](https://n8n.io) - Workflow automation
- [X402 Protocol](https://www.x402.org/) - HTTP payment standard
- [Base](https://base.org) - L2 blockchain

---

Made with ❤️ by the AgnicWallet team
