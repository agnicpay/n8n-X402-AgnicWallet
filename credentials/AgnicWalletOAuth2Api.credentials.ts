import { ICredentialType, INodeProperties } from "n8n-workflow";

export class AgnicWalletOAuth2Api implements ICredentialType {
  name = "agnicWalletOAuth2Api";
  extends = ["oAuth2Api"];
  displayName = "AgnicWallet OAuth2 API";
  documentationUrl = "https://github.com/agnicpay/n8n-X402-AgnicWallet#readme";

  properties: INodeProperties[] = [
    {
      displayName: "Grant Type",
      name: "grantType",
      type: "hidden",
      default: "authorizationCode",
    },
    {
      displayName: "Authorization URL",
      name: "authUrl",
      type: "string",
      default: "https://api.agnic.ai/oauth/authorize",
      required: true,
      description: "The OAuth2 authorization endpoint",
    },
    {
      displayName: "Access Token URL",
      name: "accessTokenUrl",
      type: "string",
      default: "https://api.agnic.ai/oauth/token",
      required: true,
      description: "The OAuth2 token endpoint",
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      default: "n8n_default",
      required: true,
      description: "OAuth2 Client ID (default: n8n_default)",
    },
    {
      displayName: "Client Secret",
      name: "clientSecret",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      description: "OAuth2 Client Secret (optional for PKCE)",
    },
    {
      displayName: "Scope",
      name: "scope",
      type: "string",
      default: "payments:sign balance:read",
      description: "OAuth2 scopes",
    },
    {
      displayName: "Auth URI Query Parameters",
      name: "authQueryParameters",
      type: "string",
      default: "",
      description: "Additional query parameters for authorization URL",
    },
    {
      displayName: "Authentication",
      name: "authentication",
      type: "options",
      options: [
        {
          name: "Body",
          value: "body",
        },
        {
          name: "Header",
          value: "header",
        },
      ],
      default: "body",
      description: "How to send credentials",
    },
    {
      displayName: "Use PKCE",
      name: "usePKCE",
      type: "boolean",
      default: true,
      description: "Whether to use PKCE (Proof Key for Code Exchange)",
    },
  ];
}
