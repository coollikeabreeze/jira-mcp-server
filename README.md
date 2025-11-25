# Jira MCP Server - Local Test Project

A test project for a Model Context Protocol (MCP) server for creating Jira issues via HTTP API. This server provides a local HTTPS endpoint that accepts MCP protocol requests to create Jira tickets. Instructions included to test via Postman.

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

## Testing with Postman

### Using Postman MCP Client

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
- `description` (string) - Issue description
- `issuetype` (string) - Issue type name (e.g., "Task", "Bug", "Story")

**Optional parameters:**

- `parentKey` (string) - Parent issue key for subtasks
- `labels` (array of strings) - Labels to apply to the issue

**Example tool call:**

- Tool: `create_jira_issue`
- Arguments:
  ```json
  {
    "summary": "Test Issue from Postman",
    "description": "This is a test issue created via the MCP server",
    "issuetype": "Task",
    "parentKey": "PROJ-123",
    "labels": ["test", "postman"]
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

```
https://your-service-name.onrender.com/mcp
```

You can test it using Postman MCP Client:

- Server URL: `https://your-service-name.onrender.com/mcp`
- Connection Type: HTTPS (no certificate warnings since Render provides valid SSL)

## Development

The server uses:

- Express.js for the HTTP server
- Model Context Protocol SDK for MCP protocol handling
- TypeScript for type safety

## License

ISC
