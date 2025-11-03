# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-11-03

### Added
- Multi-chain support for Base (EVM) and Solana (SVM)
- Mainnet and testnet support for both chains
- OAuth2 authentication support
- API Key authentication support
- Automatic X402 payment handling
- Custom headers support
- JSON body support for POST/PUT requests
- Payment metadata in responses
- Monthly spending limits
- Built-in safety controls

### Features
- GET, POST, PUT, DELETE HTTP methods
- AgnicWallet backend integration
- Payment signing via `/api/sign-payment` endpoint
- Non-custodial wallet support via Privy
- USDC payments on Base and Solana
- Gasless transactions using EIP-3009 TransferWithAuthorization

### Documentation
- Comprehensive README with examples
- Usage guide for X402 HTTP requests
- Publishing guide for n8n community nodes
- Enhancement plan for future features

## [Unreleased]

### Planned for v1.1.0
- Query parameters support
- Form-encoded body support
- Timeout configuration
- Retry logic improvements

### Planned for v1.2.0
- Additional EVM networks (Polygon, Arbitrum, etc.)
- Exponential backoff for retries
- Enhanced rate limiting

### Planned for v2.0.0
- File upload support
- Streaming responses
- Webhook triggers

---

[1.0.3]: https://github.com/agnicpay/n8n-nodes-agnicwallet/releases/tag/v1.0.3
