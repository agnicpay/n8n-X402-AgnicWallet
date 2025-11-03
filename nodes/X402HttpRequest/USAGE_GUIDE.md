# AgnicWallet X402 Node - Usage Guide

## Basic Configuration

### 1. Authentication

- **OAuth2** (Recommended): Connect your AgnicWallet account
- **API Key**: Use your API token for automation

### 2. Method Selection

- **GET**: For retrieving data (no body field)
- **POST**: For sending data (body field appears)
- **PUT**: For updating data (body field appears)
- **DELETE**: For deleting resources

### 3. URL

Enter the X402-enabled API endpoint:

```
https://agnicbillo-proxy.asad-safari.workers.dev/v1/custom/chatgpt/v1/chat/completions
```

### 4. Headers (Optional)

Click "Add Header" to add custom headers:

- **Name**: `X-AgnicBillo-Key`
- **Value**: `agb_qroy8w9rb5lnpcla8ydl`

### 5. Body (Only visible when POST/PUT selected)

**IMPORTANT**: Body field only appears when Method is POST or PUT!

Switch Method to POST, then enter JSON:

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{ "role": "user", "content": "Say hello" }]
}
```

## Example: X402 Protected Content

### Step-by-Step Configuration:

1. **Add Node**: Drag "AgnicWallet X402 Request" to canvas
2. **Authentication**: Select OAuth2 or API Key
3. **Method**: Select **GET**
4. **URL**:
   ```
   https://www.x402.org/protected
   ```
5. **Headers**: None needed for this example
6. **Run**: Execute the workflow!

### What Happens:

1. Node makes GET request to protected endpoint
2. Receives 402 Payment Required
3. **Automatically** signs payment ($0.01 USDC) with your AgnicWallet
4. Retries request with payment proof
5. Returns protected content + payment details

### Expected Response:

```json
{
  "data": "<!DOCTYPE html>...<h1>Protected Content</h1><p>Your payment was successful! Enjoy this banger song.</p>...",
  "_agnicWallet": {
    "paymentMade": true,
    "amountPaid": 0.01,
    "timestamp": "2025-10-28T..."
  }
}
```

## Example: ChatGPT via X402 (Advanced)

For POST requests with JSON body:

1. **Method**: Select **POST**
2. **URL**:
   ```
   https://agnicbillo-proxy.asad-safari.workers.dev/v1/custom/chatgpt/v1/chat/completions
   ```
3. **Headers**: Add one header
   - Name: `X-AgnicBillo-Key`
   - Value: `agb_qroy8w9rb5lnpcla8ydl`
4. **Body**: (Now visible!) Paste this JSON:
   ```json
   {
     "model": "gpt-3.5-turbo",
     "messages": [{ "role": "user", "content": "Say hello" }]
   }
   ```

Same automatic payment flow, returns ChatGPT response.

## Common Issues

### "I don't see the Body field!"

**Solution**: Change Method from GET to POST. Body only shows for POST/PUT methods.

### "Payment signing failed"

**Solution**:

1. Check your AgnicWallet credentials are connected
2. Ensure you have USDC balance on Base Sepolia
3. Check backend URL is accessible

### "Request failed after payment"

**Solution**:

1. Verify the URL is correct
2. Check headers are properly set
3. Ensure JSON body is valid

## Testing Without Payment

For testing endpoints that don't require payment:

1. **Method**: GET
2. **URL**: `https://www.x402.org/free-endpoint`
3. **Headers**: (none needed)
4. **Body**: (not visible for GET)

## Advanced: Using Expressions

N8N supports dynamic values using expressions:

### Dynamic Message:

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{ "role": "user", "content": "{{ $json.userMessage }}" }]
}
```

### Dynamic Headers:

- Name: `X-API-Key`
- Value: `{{ $json.apiKey }}`

This pulls data from previous nodes in your workflow!
