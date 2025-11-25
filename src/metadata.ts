import "dotenv/config";

const RESOURCE_SERVER_URL =
  process.env.RESOURCE_SERVER_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "https://localhost:3000";

// OAuth Authorization Server Metadata
// https://datatracker.ietf.org/doc/html/rfc8414
export const oauthMetadata = {
  issuer: RESOURCE_SERVER_URL,
  authorization_endpoint: `${RESOURCE_SERVER_URL}/oauth/authorize`,
  token_endpoint: `${RESOURCE_SERVER_URL}/oauth/token`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code"],
  code_challenge_methods_supported: ["S256", "plain"],
  token_endpoint_auth_methods_supported: ["none"], // Public client (PKCE only)
};

// Protected Resource Metadata
// https://datatracker.ietf.org/doc/html/rfc9728
export const protectedResourceMetadata = {
  resource: RESOURCE_SERVER_URL,
  authorization_servers: [RESOURCE_SERVER_URL],
  scopes_supported: ["jira:write"],
  resource_documentation: `${RESOURCE_SERVER_URL}/docs`,
  token_endpoint_auth_methods_supported: ["none"],
};
