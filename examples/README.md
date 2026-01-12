# Example Workflows

This directory contains example n8n workflows demonstrating how to use the AgnicWallet X402 Request node.

## How to Use These Examples

1. Open n8n
2. Click on "Workflows" → "Import from File"
3. Select one of the JSON files from this directory
4. Configure your AgnicWallet credentials
5. Execute the workflow

## Available Examples

### 1. simple-get-request.json
A basic example showing how to make a GET request to an X402-protected API endpoint.

**What it demonstrates:**
- Simple GET request
- Automatic payment handling
- Payment metadata in response

**Use case:** Fetching protected content or data from an X402-enabled API

### 2. post-with-json-body.json
An example showing how to make a POST request with a JSON body.

**What it demonstrates:**
- POST request with JSON body
- Custom headers
- Dynamic content from previous nodes

**Use case:** Submitting data to an X402-protected API (e.g., AI chat completion)

### 3. multi-step-workflow.json
A more complex workflow showing integration with other n8n nodes.

**What it demonstrates:**
- Chaining multiple nodes together
- Using data from previous nodes in AgnicWallet requests
- Conditional logic based on payment results
- Error handling

**Use case:** Building complex workflows that incorporate X402 payments

## Prerequisites

Before using these examples:

1. Install n8n-nodes-agnic: `npm install -g n8n-nodes-agnic`
2. Create an AgnicWallet account at https://pay.agnic.ai
3. Configure your credentials in n8n (OAuth2 or API Key)
4. Ensure you have USDC balance in your AgnicWallet

## Need Help?

- Check the [main README](../README.md) for detailed documentation
- Review the [Usage Guide](../nodes/X402HttpRequest/USAGE_GUIDE.md)
- Open an issue on [GitHub](https://github.com/agnicpay/n8n-X402-AgnicWallet/issues)

## Contributing Examples

Have a cool workflow using AgnicWallet? We'd love to include it!

1. Fork the repository
2. Add your example JSON file to this directory
3. Update this README with a description
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
