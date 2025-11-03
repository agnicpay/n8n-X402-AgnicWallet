# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-11-03

### Fixed
- Removed `process.env` usage to comply with n8n community node security requirements
- Hardcoded API endpoint to `https://api.agnicpay.xyz` (was using environment variable override)
- Fixed n8n automated verification checks

### Changed
- API URL is now fixed to production endpoint (environment variable override removed for security)

## [1.0.5] - 2025-11-03

### Changed
- Updated documentation to remove third-party infrastructure references
- Improved security messaging with generic descriptions of key management

### Documentation
- Enhanced wallet safety FAQ with more professional language
- Updated backend architecture descriptions for better clarity

## [1.0.4] - 2025-11-03

### Changed
- Migrated repository to standalone location: https://github.com/agnicpay/n8n-X402-AgnicWallet
- Updated all documentation and links to point to new repository
- No code changes - this is a metadata/documentation update only

### Documentation
- Enhanced README with backend API dependency explanation
- Added comprehensive FAQ section
- Added detailed security and trust model explanation
- Updated all GitHub URLs to new standalone repository

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
- Non-custodial wallet support with secure key management
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

[1.0.6]: https://github.com/agnicpay/n8n-X402-AgnicWallet/releases/tag/v1.0.6
[1.0.5]: https://github.com/agnicpay/n8n-X402-AgnicWallet/releases/tag/v1.0.5
[1.0.4]: https://github.com/agnicpay/n8n-X402-AgnicWallet/releases/tag/v1.0.4
[1.0.3]: https://github.com/agnicpay/n8n-X402-AgnicWallet/releases/tag/v1.0.3
