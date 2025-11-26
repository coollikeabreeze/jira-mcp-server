# Jira MCP Server

A Model Context Protocol (MCP) server for creating Jira issues. This server implements the MCP protocol and can be used with MCP-compatible clients (like Postman MCP Client) or integrated as a Custom GPT Action for ChatGPT.

## Overview

This is a dual-purpose server that provides:

- **MCP Protocol Endpoint** (`/mcp`) - For MCP-compatible clients using the Model Context Protocol
- **REST API Endpoint** (`/api/create-issue`) - For Custom GPT Actions and other REST API clients

Both endpoints create Jira issues, but use different protocols. The MCP endpoint uses JSON-RPC format, while the REST endpoint uses standard HTTP/JSON.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Jira account with API access
- Postman (or any HTTP client) for testing

## Installation

1. Clone the repository:

```bash
git clone https://github.com/coollikeabreeze/jira-mcp-server.git
cd jira-mcp-server
```

2. Install dependencies:

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# YOUR JIRA ACCOUNT & TOKEN INFORMATION
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY
PORT=3000
```

**Getting your Jira API Token:**

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the token and add it to your `.env` file

### SSL Certificates

The server uses HTTPS with self-signed certificates. Generate them using:

```bash
openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.cert -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

This will create:

- `server.key` - Private key (already in `.gitignore`)
- `server.cert` - Certificate file (already in `.gitignore`)

## Running the Server

Start the development server:

```bash
npm run dev
```

The server will start on `https://localhost:3000/mcp` (or your configured PORT).

## Usage

### As an MCP Server

The primary use case is as an MCP server. Connect using any MCP-compatible client:

#### Testing with Postman MCP Client

Postman has built-in support for MCP servers via the MCP Client. Here's how to connect:

1. **Open Postman MCP Client**:

   - In Postman, navigate to the MCP Client section
   - Click "Add Server" or "Connect to Server"

2. **Configure HTTPS Connection**:

   - Select **HTTPS** as the connection type
   - Server URL: `https://localhost:3000/mcp`
   - Port: `3000` (or your configured PORT)
   - **Important**: Since we're using self-signed certificates, you may need to:
     - Accept the certificate warning, or
     - Go to Postman Settings → General and temporarily disable "SSL certificate verification"

3. **Connect to the Server**:
   - Click "Connect" to establish the connection
   - Postman will automatically discover available tools from the MCP server

### Using the create_jira_issue Tool

Once connected, you can use the `create_jira_issue` tool:

**Required parameters:**

- `summary` (string) - Issue summary/title
- `description` (string or ADF JSON object) - Issue description. Accepts:
  - **String**: Plain text description (will be converted to ADF format)
  - **ADF JSON object**: Atlassian Document Format for rich text (preferred). This is the format sent by Custom GPT Actions, supporting bold, italic, links, lists, and other formatting.
- `issuetype` (string) - Issue type name (e.g., "Task", "Bug", "Story")

**Optional parameters:**

- `parentKey` (string) - Parent issue key for subtasks
- `labels` (array of strings) - Labels to apply to the issue

**Example tool call:**

- Tool: `create_jira_issue`
- Arguments (with string description):

  ```json
  {
    "summary": "Test Issue from Postman",
    "description": "This is a test issue created via the MCP server",
    "issuetype": "Task",
    "parentKey": "PROJ-123",
    "labels": ["test", "postman"]
  }
  ```

- Arguments (with ADF JSON description - used by Custom GPT Actions):
  ```json
  {
    "summary": "Test Issue from GPT",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "This is a test issue with "
            },
            {
              "type": "text",
              "text": "rich text formatting",
              "marks": [
                {
                  "type": "strong"
                }
              ]
            }
          ]
        }
      ]
    },
    "issuetype": "Task",
    "labels": ["test", "gpt"]
  }
  ```

### Example Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Created Jira issue PROJ-456"
      }
    ],
    "meta": {
      "issueKey": "PROJ-456",
      "issueId": "12345",
      "url": "https://your-domain.atlassian.net/rest/api/3/issue/12345"
    }
  }
}
```

### Error Handling

If there's an error, you'll receive a response like:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": "Jira error 400: ..."
  }
}
```

## Troubleshooting

- **SSL Certificate Error**:
  - Accept the certificate warning when connecting, or
  - Temporarily disable SSL verification in Postman Settings → General
- **Connection Refused**:
  - Ensure the server is running (`npm run dev`)
  - Verify the server URL matches: `https://localhost:3000/mcp`
  - Check that the port matches your `PORT` environment variable
- **MCP Client Connection Issues**:
  - Make sure you're using the HTTPS option in Postman MCP Client
  - Verify the server is accessible at the configured URL
- **Jira API Errors**:
  - Check that your API token and project key are correct in the `.env` file
  - Verify your Jira account has permissions to create issues in the project
- **Missing Environment Variables**:
  - Verify all required variables are set in your `.env` file
  - Restart the server after updating `.env` file

## Deployment to Render

This server can be deployed to Render for a public HTTPS endpoint.

### Prerequisites

- A Render account (free tier available)
- Your repository pushed to GitHub (or connected to Render)

### Deployment Steps

1. **Connect Repository to Render**:

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `jira-mcp-server` repository

2. **Configure the Service**:

   - **Name**: `jira-mcp-server` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan)

3. **Set Environment Variables**:
   Add the following environment variables in Render's dashboard:

   - `JIRA_BASE_URL` - Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)
   - `JIRA_EMAIL` - Your Jira account email
   - `JIRA_API_TOKEN` - Your Jira API token
   - `JIRA_PROJECT_KEY` - Your Jira project key
   - `USE_HTTPS` - Set to `false` (Render handles HTTPS termination)
   - `NODE_ENV` - Set to `production`

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your service
   - Your service will be available at `https://your-service-name.onrender.com/mcp`

### Using render.yaml (Alternative)

If you prefer configuration as code, you can use the included `render.yaml` file:

1. Push your code to GitHub (make sure `render.yaml` is included)
2. In Render Dashboard, go to "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect and use `render.yaml`
5. Set the environment variables (marked as `sync: false` in the YAML)

### Post-Deployment

After deployment, your MCP server will be available at:

- **MCP Endpoint**: `https://your-service-name.onrender.com/mcp`
- **REST API Endpoint**: `https://your-service-name.onrender.com/api/create-issue`

**Testing the MCP Endpoint:**

- Use Postman MCP Client or any MCP-compatible client
- Server URL: `https://your-service-name.onrender.com/mcp`
- Connection Type: HTTPS (no certificate warnings since Render provides valid SSL)

**Testing the REST API Endpoint:**

- Use any HTTP client or integrate as a Custom GPT Action
- Endpoint: `https://your-service-name.onrender.com/api/create-issue`
- Requires Bearer token authentication (set `API_KEY` in Render)

### As a Custom GPT Action

This MCP server also exposes a REST API endpoint compatible with Custom GPT Actions, allowing you to integrate Jira issue creation directly into ChatGPT.

**Setup Steps:**

1. **Deploy to Render** (see Deployment section below)
2. **Copy the OpenAPI Schema**: Copy the contents of `openapi.yaml` from your repository
3. **Add to Custom GPT**: In your Custom GPT configuration, go to Actions → Create new action → Paste the schema
4. **Configure Authentication**:
   - Select "Bearer" authentication
   - Enter your `API_KEY` value (set in Render environment variables)
5. **Description Format**: When using Custom GPT Actions, the `description` field will be automatically sent as ADF JSON format, enabling rich text formatting in Jira issues (bold, italic, links, lists, etc.)

**Endpoints:**

- `/mcp` - MCP protocol endpoint (for MCP clients)
- `/api/create-issue` - REST API endpoint (for Custom GPT Actions)

## Development

The server uses:

- Express.js for the HTTP server
- Model Context Protocol SDK for MCP protocol handling
- TypeScript for type safety

## License

ISC
