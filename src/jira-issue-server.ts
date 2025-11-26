import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { createJiraIssue } from "./jiraClient.js";

const server = new McpServer({
  name: "jira-ticket-server",
  version: "0.1.0",
});

const createIssueSchema = z.object({
  summary: z.string(),
  description: z.string(),
  issuetype: z.string(),
  // sprint: z.string().optional(),
  parentKey: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

server.registerTool(
  "create_jira_issue",
  {
    title: "Create Jira Issue Tool",
    description: "Create a Jira issue in the configured project",
    inputSchema: createIssueSchema,
  },
  async ({
    summary,
    description,
    issuetype,
    // sprint,
    parentKey,
    labels,
  }) => {
    const result = await createJiraIssue({
      summary,
      description,
      issuetype,
      // sprint,
      parentKey,
      labels,
    });
    return {
      content: [
        {
          type: "text",
          text: `Created Jira issue ${result.key}`,
        },
      ],
      // You can optionally return structured data for UIs:
      meta: {
        issueKey: result.key,
        issueId: result.id,
        url: result.self,
      },
    };
  }
);

import https from "https";
import http from "http";
import fs from "fs";
import "dotenv/config";

const app = express();
app.use(express.json());

// API Key Authentication Middleware
const apiKeyAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "");
  const validApiKey = process.env.API_KEY;

  // Skip auth for health checks only
  if (req.path === "/" || (req.path === "/mcp" && req.method === "GET")) {
    return next();
  }

  // In production, require API key
  if (process.env.NODE_ENV === "production" && !validApiKey) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "API_KEY environment variable is required in production",
    });
  }

  // If no API_KEY is set (development only), allow access
  if (!validApiKey) {
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Valid API key required. Provide it in X-API-Key header or Authorization: Bearer <key>",
    });
  }

  next();
};

app.use(apiKeyAuth);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "jira-mcp-server" });
});

// OpenAPI spec endpoint removed for security
// Paste the openapi.yaml content directly into Custom GPT Actions instead

// Health check for /mcp endpoint
app.get("/mcp", (req, res) => {
  res.json({
    status: "ok",
    service: "jira-mcp-server",
    endpoint: "/mcp",
    method: "POST",
    protocol: "MCP",
  });
});

// OpenAPI endpoint for Custom GPT Actions
app.post("/api/create-issue", async (req, res) => {
  try {
    const { summary, description, issuetype, parentKey, labels } = req.body;

    if (!summary || !description || !issuetype) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["summary", "description", "issuetype"],
      });
    }

    // Validate ADF structure if provided as object (strings will be converted in jiraClient)
    if (typeof description === "object" && description !== null) {
      if (
        description.type !== "doc" ||
        description.version !== 1 ||
        !Array.isArray(description.content)
      ) {
        return res.status(400).json({
          error: "Invalid ADF format",
          message:
            "If description is provided as an object, it must be valid ADF JSON with type 'doc', version 1, and a content array",
          example: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Description text" }],
              },
            ],
          },
        });
      }
    }

    const result = await createJiraIssue({
      summary,
      description,
      issuetype,
      parentKey,
      labels,
    });

    res.json({
      success: true,
      issueKey: result.key,
      issueId: result.id,
      url: result.self,
      message: `Created Jira issue ${result.key}`,
    });
  } catch (error) {
    console.error("Error creating Jira issue:", error);
    res.status(500).json({
      error: "Failed to create Jira issue",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/mcp", async (req, res) => {
  console.log("\n=== Incoming Request ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Body:", req.body);

  // Capture response body
  let responseBody = "";
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = function (chunk: any, ...args: any[]) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return originalWrite(chunk, ...args);
  };

  res.end = function (chunk: any, ...args: any[]) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return originalEnd(chunk, ...args);
  };

  // Monitor what status code gets sent
  res.on("finish", () => {
    console.log("=== Response Sent ===");
    console.log("Status Code:", res.statusCode);
    console.log("Status Message:", res.statusMessage);
    console.log("Response Body:", responseBody);
  });

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    console.log("Request completed successfully\n");
  } catch (error) {
    console.error("\n=== ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("Full error:", error);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }

    // Send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

const port = parseInt(process.env.PORT || "3000");

// On Render, use HTTP (Render handles HTTPS termination)
// Locally, use HTTPS with self-signed certificates
const useHttps =
  process.env.USE_HTTPS !== "false" &&
  fs.existsSync("server.key") &&
  fs.existsSync("server.cert");

if (useHttps) {
  const httpsOptions = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
  };
  https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`MCP Server running on https://localhost:${port}/mcp`);
  });
} else {
  // HTTP mode (for Render or when certs don't exist)
  http.createServer(app).listen(port, () => {
    const protocol = process.env.RENDER ? "https" : "http";
    console.log(`MCP Server running on ${protocol}://localhost:${port}/mcp`);
  });
}
