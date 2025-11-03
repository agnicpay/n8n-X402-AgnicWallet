import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";

export class X402HttpRequest implements INodeType {
  description: INodeTypeDescription = {
    displayName: "AgnicWallet X402 Request",
    name: "agnicWalletX402Request",
    group: ["transform"],
    version: 1,
    description:
      "Make HTTP requests to X402-enabled APIs with automatic payment via AgnicWallet",
    defaults: {
      name: "AgnicWallet X402",
    },
    usableAsTool: true,
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "agnicWalletOAuth2Api",
        required: false,
        displayOptions: {
          show: {
            authentication: ["oAuth2"],
          },
        },
      },
      {
        name: "agnicWalletApi",
        required: false,
        displayOptions: {
          show: {
            authentication: ["apiKey"],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Authentication",
        name: "authentication",
        type: "options",
        options: [
          {
            name: "OAuth2",
            value: "oAuth2",
            description: "Recommended: Connect your account",
          },
          {
            name: "API Key",
            value: "apiKey",
            description: "For CI/CD or programmatic access",
          },
        ],
        default: "oAuth2",
        description: "How to authenticate with AgnicWallet",
      },
      {
        displayName: "Method",
        name: "method",
        type: "options",
        options: [
          {
            name: "GET",
            value: "GET",
          },
          {
            name: "POST",
            value: "POST",
          },
          {
            name: "PUT",
            value: "PUT",
          },
          {
            name: "DELETE",
            value: "DELETE",
          },
        ],
        default: "GET",
        description: "The HTTP method to use",
      },
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        required: true,
        placeholder: "https://api.example.com/endpoint",
        description: "The URL of the X402-enabled API",
      },
      {
        displayName: "Headers",
        name: "headers",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: "header",
            displayName: "Header",
            values: [
              {
                displayName: "Name",
                name: "name",
                type: "string",
                default: "",
                description: "Name of the header",
              },
              {
                displayName: "Value",
                name: "value",
                type: "string",
                default: "",
                description: "Value of the header",
              },
            ],
          },
        ],
        description: "Additional headers to send with the request",
      },
      {
        displayName: "Body",
        name: "body",
        type: "json",
        default: "{}",
        displayOptions: {
          show: {
            method: ["POST", "PUT"],
          },
        },
        description: "JSON body to send with the request",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        // Get authentication type
        const authentication = this.getNodeParameter(
          "authentication",
          itemIndex,
        ) as string;

        let apiBaseUrl: string;
        let authHeader: string;

        // Use AgnicWallet backend API endpoint (production cloud)
        apiBaseUrl = "https://api.agnicpay.xyz";

        if (authentication === "oAuth2") {
          // OAuth2 authentication
          const credentials = (await this.getCredentials(
            "agnicWalletOAuth2Api",
            itemIndex,
          )) as any;
          authHeader = `Bearer ${credentials.oauthTokenData.access_token}`;
        } else {
          // API Key authentication
          const credentials = await this.getCredentials(
            "agnicWalletApi",
            itemIndex,
          );
          const { apiToken } = credentials as { apiToken: string };
          authHeader = apiToken;
        }

        // Get parameters
        const method = this.getNodeParameter("method", itemIndex) as string;
        const url = this.getNodeParameter("url", itemIndex) as string;
        const headersConfig = this.getNodeParameter(
          "headers",
          itemIndex,
          {},
        ) as any;
        const body = this.getNodeParameter("body", itemIndex, "{}") as string;

        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (headersConfig.header) {
          headersConfig.header.forEach((h: any) => {
            headers[h.name] = h.value;
          });
        }

        // Make request with X402 payment handling
        const response = await makeX402Request(this, {
          url,
          method,
          headers,
          body:
            method === "POST" || method === "PUT"
              ? JSON.parse(body)
              : undefined,
          agnicWalletApi: apiBaseUrl,
          authHeader,
          isOAuth: authentication === "oAuth2",
        });

        returnData.push({
          json: response,
          pairedItem: {
            item: itemIndex,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: errorMessage,
            },
            pairedItem: {
              item: itemIndex,
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), errorMessage, {
          itemIndex,
        });
      }
    }

    return [returnData];
  }
}

// Helper function: Make X402 request with automatic payment
async function makeX402Request(
  context: IExecuteFunctions,
  config: any,
): Promise<any> {
  const { url, method, headers, body, agnicWalletApi, authHeader, isOAuth } =
    config;

  try {
    // 1. Try the request first (may return 402)
    context.logger.info(`Making initial request to: ${url}`);
    let response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    context.logger.info(`Response status: ${response.status}`);

    // 2. If 402 Payment Required, use AgnicWallet to sign
    if (response.status === 402) {
      context.logger.info(
        "402 Payment Required detected, parsing payment requirements...",
      );

      // Get response text first for debugging
      const responseText = await response.text();
      context.logger.info(`Payment requirements response: ${responseText}`);

      let paymentRequirements;
      try {
        paymentRequirements = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          `Failed to parse payment requirements: ${parseError instanceof Error ? parseError.message : "Unknown error"}. Response: ${responseText}`,
        );
      }

      context.logger.info(
        `Payment required: ${JSON.stringify(paymentRequirements)}`,
      );

      // 3. Call AgnicWallet signing API
      context.logger.info(
        `Calling AgnicWallet API at: ${agnicWalletApi}/api/sign-payment`,
      );

      // Build auth headers based on auth type
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isOAuth) {
        // OAuth: Use Authorization header with Bearer token
        authHeaders["Authorization"] = authHeader;
      } else {
        // API Key: Use X-Agnic-Token header
        authHeaders["X-Agnic-Token"] = authHeader;
      }

      const signingResponse = await fetch(
        `${agnicWalletApi}/api/sign-payment`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            paymentRequirements,
            requestData: { url, method, body },
          }),
        },
      );

      if (!signingResponse.ok) {
        const errorText = await signingResponse.text();
        context.logger.error(`AgnicWallet signing failed: ${errorText}`);
        throw new Error(
          `Payment signing failed (${signingResponse.status}): ${errorText}`,
        );
      }

      const signingResult = (await signingResponse.json()) as {
        paymentHeader: string;
        paymentProof: any;
        amountPaid: number;
      };
      const { paymentHeader, amountPaid } = signingResult;

      context.logger.info(`Payment signed successfully: $${amountPaid}`);
      context.logger.info(`Payment header (Base64): ${paymentHeader}`);

      // 4. Retry original request with payment header
      // The paymentHeader is already Base64-encoded and X402-compliant
      context.logger.info("Retrying request with X402 payment header...");

      response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "X-PAYMENT": paymentHeader,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      context.logger.info(`Retry response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed after payment (${response.status}): ${errorText}`,
        );
      }

      const resultText = await response.text();
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (parseError) {
        context.logger.warn(`Response is not JSON: ${resultText}`);
        result = { data: resultText };
      }

      return {
        ...(typeof result === "object" && result !== null ? result : {}),
        _agnicWallet: {
          paymentMade: true,
          amountPaid,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // 5. If no payment required, just return the result
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed (${response.status} ${response.statusText}): ${errorText}`,
      );
    }

    const resultText = await response.text();
    try {
      return JSON.parse(resultText);
    } catch (parseError) {
      context.logger.warn(`Response is not JSON: ${resultText}`);
      return { data: resultText };
    }
  } catch (error) {
    context.logger.error(
      `Error in makeX402Request: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}
