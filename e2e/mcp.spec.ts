import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { expect, test } from "@playwright/test";
import { e2eAgent } from "./fixtures";

// The journey every agent takes: connect to /api/mcp with its token, list tools, call one.

async function connect(baseURL: string, token: string): Promise<Client> {
  const client = new Client({ name: "e2e", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL("/api/mcp", baseURL), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  await client.connect(transport);
  return client;
}

test("an agent connects with its token and identifies itself @smoke", async ({ baseURL }) => {
  const agent = e2eAgent();
  if (!baseURL) throw new Error("No baseURL configured.");
  const client = await connect(baseURL, agent.token);
  try {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain("whoami");

    const result = await client.callTool({ name: "whoami", arguments: {} });
    expect(result.structuredContent).toEqual({ agent: agent.name, client: "claude" });
  } finally {
    await client.close();
  }
});

test("the MCP endpoint turns away requests without a valid token @smoke", async ({ request }) => {
  const body = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream" };

  const anonymous = await request.post("/api/mcp", { data: body, headers });
  expect(anonymous.status()).toBe(401);

  const forged = await request.post("/api/mcp", {
    data: body,
    headers: { ...headers, authorization: `Bearer lah_${"x".repeat(43)}` },
  });
  expect(forged.status()).toBe(401);
});
