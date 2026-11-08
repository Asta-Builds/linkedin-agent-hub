import "server-only";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { findActiveAgentByToken, type ActiveAgent } from "../agents";
import { getDb } from "../db";

/** Scopes every agent token carries. Publishing is not one of them: only the owner publishes. */
const AGENT_SCOPES = ["profile:read", "drafts:write"] as const;

/** `withMcpAuth` verifier: maps a bearer token to its agent, or rejects it. */
export async function verifyAgentToken(_request: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  const agent = await findActiveAgentByToken(getDb(), bearerToken);
  if (!agent) return undefined;
  return { token: bearerToken, clientId: agent.id, scopes: [...AGENT_SCOPES], extra: { agent } };
}

/** The calling agent, from the auth info `verifyAgentToken` attached to the request. */
export function agentFromAuth(authInfo: AuthInfo | undefined): ActiveAgent {
  const agent = authInfo?.extra?.agent as ActiveAgent | undefined;
  // withMcpAuth({ required: true }) rejects unauthenticated requests before any tool runs.
  if (!agent) throw new Error("No authenticated agent on this request.");
  return agent;
}
