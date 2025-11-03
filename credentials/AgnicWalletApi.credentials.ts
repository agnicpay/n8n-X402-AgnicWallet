import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class AgnicWalletApi implements ICredentialType {
  name = "agnicWalletApi";
  displayName = "AgnicWallet API";
  documentationUrl = "https://github.com/agnicpay/n8n-X402-AgnicWallet#setup";
  properties: INodeProperties[] = [
    {
      displayName: "User ID",
      name: "userId",
      type: "string",
      default: "",
      required: true,
      description: "Your AgnicWallet user ID (from dashboard)",
      placeholder: "user_2kX9mNz8pQw7VbC",
    },
    {
      displayName: "API Token",
      name: "apiToken",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      required: true,
      description: "Your AgnicWallet API token (starts with agnic_tok_)",
      placeholder: "agnic_tok_sk_live_...",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "X-Agnic-Token": "={{$credentials.apiToken}}",
      },
    },
  };
}
