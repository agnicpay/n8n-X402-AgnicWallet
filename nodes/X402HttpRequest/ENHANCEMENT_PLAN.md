# N8N X402 Node Enhancement Plan

## Current State ✅

- Authentication (OAuth2 + API Key)
- HTTP Methods (GET, POST, PUT, DELETE)
- URL input
- Custom Headers
- JSON Body (POST/PUT only)
- X402 payment handling

## Proposed Enhancements

### 1. Query Parameters (for GET/all requests)

```typescript
{
  displayName: 'Query Parameters',
  name: 'queryParameters',
  type: 'fixedCollection',
  typeOptions: {
    multipleValues: true,
  },
  default: {},
  options: [
    {
      name: 'parameter',
      displayName: 'Parameter',
      values: [
        {
          displayName: 'Name',
          name: 'name',
          type: 'string',
          default: '',
        },
        {
          displayName: 'Value',
          name: 'value',
          type: 'string',
          default: '',
        },
      ],
    },
  ],
  description: 'Query parameters to append to the URL',
}
```

### 2. Body Type Options (instead of JSON only)

```typescript
{
  displayName: 'Send Body',
  name: 'sendBody',
  type: 'boolean',
  default: true,
  displayOptions: {
    show: {
      method: ['POST', 'PUT', 'PATCH'],
    },
  },
},
{
  displayName: 'Body Content Type',
  name: 'bodyContentType',
  type: 'options',
  options: [
    {
      name: 'JSON',
      value: 'json',
    },
    {
      name: 'Form URL Encoded',
      value: 'form',
    },
    {
      name: 'Form Data (Multipart)',
      value: 'multipart',
    },
    {
      name: 'Raw',
      value: 'raw',
    },
  ],
  default: 'json',
  displayOptions: {
    show: {
      method: ['POST', 'PUT', 'PATCH'],
      sendBody: [true],
    },
  },
},
{
  displayName: 'Body (JSON)',
  name: 'bodyJson',
  type: 'json',
  default: '{}',
  displayOptions: {
    show: {
      method: ['POST', 'PUT', 'PATCH'],
      sendBody: [true],
      bodyContentType: ['json'],
    },
  },
},
{
  displayName: 'Body Parameters',
  name: 'bodyParameters',
  type: 'fixedCollection',
  typeOptions: {
    multipleValues: true,
  },
  default: {},
  displayOptions: {
    show: {
      method: ['POST', 'PUT', 'PATCH'],
      sendBody: [true],
      bodyContentType: ['form', 'multipart'],
    },
  },
  options: [
    {
      name: 'parameter',
      displayName: 'Parameter',
      values: [
        {
          displayName: 'Name',
          name: 'name',
          type: 'string',
          default: '',
        },
        {
          displayName: 'Value',
          name: 'value',
          type: 'string',
          default: '',
        },
      ],
    },
  ],
},
{
  displayName: 'Body (Raw)',
  name: 'bodyRaw',
  type: 'string',
  default: '',
  typeOptions: {
    alwaysOpenEditWindow: true,
  },
  displayOptions: {
    show: {
      method: ['POST', 'PUT', 'PATCH'],
      sendBody: [true],
      bodyContentType: ['raw'],
    },
  },
},
```

### 3. Response Options

```typescript
{
  displayName: 'Options',
  name: 'options',
  type: 'collection',
  placeholder: 'Add Option',
  default: {},
  options: [
    {
      displayName: 'Timeout',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'Time in milliseconds to wait for a response before timing out',
    },
    {
      displayName: 'Full Response',
      name: 'fullResponse',
      type: 'boolean',
      default: false,
      description: 'Whether to return the full response (including headers and status) instead of just the body',
    },
    {
      displayName: 'Follow Redirects',
      name: 'followRedirects',
      type: 'boolean',
      default: true,
      description: 'Whether to follow HTTP redirects',
    },
    {
      displayName: 'Ignore SSL Issues',
      name: 'ignoreSSLIssues',
      type: 'boolean',
      default: false,
      description: 'Whether to ignore SSL certificate errors',
    },
    {
      displayName: 'Response Format',
      name: 'responseFormat',
      type: 'options',
      options: [
        {
          name: 'Auto-Detect',
          value: 'auto',
        },
        {
          name: 'JSON',
          value: 'json',
        },
        {
          name: 'Text',
          value: 'text',
        },
      ],
      default: 'auto',
      description: 'How to parse the response',
    },
  ],
}
```

### 4. Better Payment Details in Response

```typescript
// Enhanced response object
return {
  ...(typeof result === "object" && result !== null
    ? result
    : { data: result }),
  _agnicWallet: {
    paymentMade: true,
    amountPaid,
    currency: "USDC",
    network: "base-sepolia",
    timestamp: new Date().toISOString(),
    transactionId: signingResult.paymentProof?.transactionId,
  },
};
```

### 5. Use Cases Supported

#### Use Case 1: ChatGPT via X402 (Your Example)

```
Method: POST
URL: https://agnicbillo-proxy.asad-safari.workers.dev/v1/custom/chatgpt/v1/chat/completions
Headers:
  - X-AgnicBillo-Key: agb_qroy8w9rb5lnpcla8ydl
Body Type: JSON
Body:
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Say hello"}]
}
```

#### Use Case 2: Search API with Query Params

```
Method: GET
URL: https://api.example.com/search
Query Parameters:
  - q: "bitcoin price"
  - limit: "10"
Headers:
  - API-Key: xxx
```

#### Use Case 3: Form Submission

```
Method: POST
URL: https://api.example.com/submit
Body Type: Form URL Encoded
Body Parameters:
  - name: John Doe
  - email: john@example.com
  - message: Hello
```

#### Use Case 4: File Upload (Future Enhancement)

```
Method: POST
URL: https://api.example.com/upload
Body Type: Form Data (Multipart)
Body Parameters:
  - file: [binary data]
  - description: "My file"
```

## Implementation Priority

### Phase 1: Essential (Do Now)

1. ✅ Query Parameters
2. ✅ Body Content Type options
3. ✅ Timeout option
4. ✅ Full response option

### Phase 2: Nice to Have

1. Form encoding support
2. Raw body support
3. Response format options
4. Better error messages

### Phase 3: Advanced

1. File upload support
2. Retry logic
3. Rate limiting handling
4. Webhook support

## Code Changes Needed

### Main Areas to Update:

1. `properties` array in node description (lines 41-139)
2. `execute` function to handle new options (lines 142-223)
3. `makeX402Request` helper to support new body types (lines 226-355)

### Estimated Lines of Code:

- Properties additions: ~200 lines
- Execute logic: ~50 lines
- Helper updates: ~100 lines
- Total: ~350 additional lines

## Testing Requirements

1. Test all body types (JSON, Form, Raw)
2. Test query parameters
3. Test timeout handling
4. Test with/without payment scenarios
5. Test error cases
6. Test with n8n expressions (e.g., `{{$json.field}}`)
