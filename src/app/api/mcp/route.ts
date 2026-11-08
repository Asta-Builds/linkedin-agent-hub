import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyAgentToken } from "@/server/mcp/auth";
import { registerTools } from "@/server/mcp/tools";

// The MCP endpoint that Codex, Claude Code, Antigravity and other agents connect to.
// Every request needs `Authorization: Bearer <agent token>`.

const handler = createMcpHandler(registerTools, {
  serverInfo: { name: "linkedin-agent-hub", version: "0.1.0" },
});

const authenticated = withMcpAuth(handler, verifyAgentToken, { required: true });

export { authenticated as DELETE, authenticated as GET, authenticated as POST };
