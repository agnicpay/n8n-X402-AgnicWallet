# Troubleshooting AgnicAI Chat Model Node

## Current Status

✅ **Node is working correctly**: The `AgnicAI Chat Model` node successfully:
- Receives messages from the AI Agent
- Makes API calls to AgnicPay AI Gateway
- Returns responses correctly
- Handles tool_calls in responses when present

⚠️ **Known Limitation**: The node cannot be used with the **Tools Agent** mode in n8n's AI Agent node. The Tools Agent checks for tool calling support during initialization before `supplyData` is called, and n8n's internal wrapper doesn't properly recognize tool calling support from custom language model nodes.

## Error: "Tools Agent requires Chat Model which supports Tools calling"

### Symptoms
When using the `AgnicAI Chat Model` node with an AI Agent configured in "Tools Agent" mode, you get this error:
```
Tools Agent requires Chat Model which supports Tools calling
```

### Cause
This is a limitation in how n8n's Tools Agent validates chat models. The check happens at `getChatModel()` during agent initialization, before the language model's `supplyData` method is called. n8n's internal wrapper that converts `SupplyData` into a LangChain chat model doesn't properly propagate tool calling support from custom nodes.

### Solutions

#### Option 1: Use Regular AI Agent (Recommended)
Instead of "Tools Agent" mode, use the regular AI Agent mode:
1. In your AI Agent node configuration
2. Set the Agent Mode to "Standard Agent" or "OpenAI Function Agent" (not "Tools Agent")
3. The `AgnicAI Chat Model` node will work perfectly in these modes

#### Option 2: Use Standalone AgnicAI Node
For workflows that don't require AI Agent features, use the standalone `AgnicAI` node instead:
1. Add the `AgnicAI` node (not `AgnicAI Chat Model`)
2. Configure messages directly in the node
3. Connect it in regular workflows (not AI Agent workflows)

#### Option 3: Wait for n8n Update
This limitation may be addressed in future versions of n8n. You can:
- Report this issue to n8n's GitHub repository
- Check n8n release notes for updates to custom language model support

## Working Configurations

✅ **Standard Agent Mode**: Works perfectly  
✅ **OpenAI Function Agent Mode**: Works perfectly  
✅ **Standalone AgnicAI Node**: Works perfectly in regular workflows  
❌ **Tools Agent Mode**: Not supported due to n8n limitation

## Technical Details

The `AgnicAI Chat Model` node:
- Returns `supportsToolCalling: true` in metadata
- Handles tool_calls in API responses
- Uses OpenAI-compatible API format (which supports tool calling)
- Works correctly when `supplyData` is called

However, the Tools Agent's validation check happens before `supplyData` is called, so it cannot detect this support.

## Logs

When the node is working, you'll see logs like:
```
[AgnicAI] supplyData called for itemIndex: 0
[AgnicAI] Found chatInput: "your message"
[AgnicAI] API request successful
[AgnicAI] Returning SupplyData with response length: ...
[AgnicAI] Model: openai/gpt-4, Provider: openai-compatible, Tool calling support: true
```

These logs confirm the node is functioning correctly, even when the Tools Agent validation fails.
