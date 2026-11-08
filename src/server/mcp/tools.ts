import "server-only";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { agentFromAuth } from "./auth";

// Every tool an agent can call. Tools that change data must:
//  - validate input with a zod schema (inputSchema),
//  - write through src/server and record an audit entry in the same transaction,
//  - never publish to LinkedIn: agents create drafts, the owner approves them.

export function registerTools(server: McpServer): void {
  server.registerTool(
    "whoami",
    {
      title: "Who am I",
      description: "Returns the name and client of the agent this token belongs to. Use it to check your connection.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async (_input, ctx) => {
      const agent = agentFromAuth(ctx.http?.authInfo);
      const result = { agent: agent.name, client: agent.client };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    },
  );
}
