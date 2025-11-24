import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import { createJiraIssue } from "./jiraClient.js";

const server = new McpServer({
  name: "jira-ticket-server",
  version: "0.1.0"
})

const createIssueSchema = z.object({
    summary: z.string(),
    description: z.string(),
    issuetype: z.string(),
    // sprint: z.string().optional(),
    parentKey: z.string().optional(),
    labels: z.array(z.string()).optional()
});

server.registerTool(
  "create_jira_issue",
  {
    title: "Create Jira Issue Tool",
    description: "Create a Jira issue in the configured project",
    inputSchema: createIssueSchema
  },
  async ({
    summary,
    description,
    issuetype,
    // sprint,
    parentKey,
    labels}) => {
    const result = await createJiraIssue({
      summary,
      description,
      issuetype,
      // sprint,
      parentKey,
      labels});
    return {
      content: [
        {
          type: "text",
          text: `Created Jira issue ${result.key}`
        }
      ],
      // You can optionally return structured data for UIs:
      meta: {
        issueKey: result.key,
        issueId: result.id,
        url: result.self
      }
    }
  }
)

import https from 'https';
import fs from 'fs';

const app = express();
app.use(express.json())

app.post("/mcp", async (req, res) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', req.body);

  // Capture response body
  let responseBody = '';
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = function(chunk: any, ...args: any[]) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return originalWrite(chunk, ...args);
  };

  res.end = function(chunk: any, ...args: any[]) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return originalEnd(chunk, ...args);
  };

  // Monitor what status code gets sent
  res.on('finish', () => {
    console.log('=== Response Sent ===');
    console.log('Status Code:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    console.log('Response Body:', responseBody);
  });

  try {
    const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true
      });

    res.on('close', () => {
          transport.close();
      });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    console.log('Request completed successfully\n');

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

const port = parseInt(process.env.PORT || '3000');

const httpsOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`MCP Server running on https://localhost:${port}/mcp`);
});
