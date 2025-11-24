import "dotenv/config";

const baseUrl = process.env.JIRA_BASE_URL!;
const email = process.env.JIRA_EMAIL!;
const apiToken = process.env.JIRA_API_TOKEN!;
const projectKey = process.env.JIRA_PROJECT_KEY!;

if (!baseUrl || !email || !apiToken || !projectKey) {
  throw new Error("Missing Jira env vars")
}

const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64")

export interface CreateIssueInput {
  summary: string,
  description: string,
  issuetype: string,
  // sprint?: string,
  parentKey?: string,
  labels?: string[]
}

export const createJiraIssue = async(input: CreateIssueInput) => {
  const body: any = {
    fields: {
      project: {
        key: projectKey
      },
      summary: input.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: input.description
              }
            ]
          }
        ]
      },
      issuetype: {
        name: input.issuetype
      }
    }
  }

  if (input.parentKey) {
    body.fields.parent = { key: input.parentKey}
  }

  if (input.labels && input.labels.length > 0) {
    body.fields.labels = input.labels;
  }

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })

  if(!response.ok) {
    const text = await response.text()
    console.error('\n=== JIRA API ERROR ===');
    console.error('Status:', response.status, response.statusText);
    console.error('Response Body:', text);
    console.error('Request Body:', JSON.stringify(body, null, 2));

    // Try to parse as JSON for better error details
    try {
      const errorJson = JSON.parse(text);
      console.error('Parsed Error:', JSON.stringify(errorJson, null, 2));
    } catch (e) {
      // Response wasn't JSON, already logged as text
    }

    throw new Error(`Jira error ${response.status}: ${text}`)
  }

  const json = await response.json()
  return json
}