import "dotenv/config";

const baseUrl = process.env.JIRA_BASE_URL!;
const email = process.env.JIRA_EMAIL!;
const apiToken = process.env.JIRA_API_TOKEN!;
const projectKey = process.env.JIRA_PROJECT_KEY!;

if (!baseUrl || !email || !apiToken || !projectKey) {
  throw new Error("Missing Jira env vars")
}

const authHeader = "Basic" + Buffer.from(`${email}:${apiToken}`).toString("base64")

export interface CreateIssueInput {
  summary: string,
  description: string,
  issueType: string,
  sprint?: string,
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
      description: input.description,
      issueType: {
        name: input.issueType
      },
      sprint: input.sprint,
      labels: input.labels
    }
  }

  if (input.parentKey) {
    body.fields.parent = { key: input.parentKey}
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
    throw new Error(`Jira error ${response.status}: ${text}`)
  }

  const json = await response.json()
  return json
}