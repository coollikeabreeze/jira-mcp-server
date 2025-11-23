import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import { createJiraIssue } from "./jiraClient.js";

const server = new McpServer({
  name: "jira-ticket-server",
  version: "0.1.0"
})

const createIssueSchema = z.object({
    summary: z.string(),
    description: z.string(),
    issueType: z.string(),
    sprint: z.string().optional(),
    parentKey: z.string().optional(),
    labels: z.array(z.string()).optional()
});


// server.tool(
//   "create_jira_issue",
//   "Create a Jira issue in the configured project",
//   createIssueSchema,
server.registerTool(
  "create_jira_issue",
  {
    title: "Create Jira Issue Tool",
    description: "Create a Jira issue in the configured project",
    inputSchema: createIssueSchema,
    // inputSchema: z.object({
    //   summary: z.string(),
    //   description: z.string(),
    //   issueType: z.string(),
    //   sprint: z.string().optional(),
    //   parentKey: z.string().optional(),
    //   labels: z.array(z.string()).optional()
    // })
  },
  async ({ summary, description, issueType, sprint, parentKey, labels}) => {
    const result = await createJiraIssue({summary, description, issueType, sprint, parentKey, labels});
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

// Start listening over stdio (for local tools like ChatGPT desktop / MCP Inspector)
const transport = new StdioServerTransport();
server.connect(transport);
