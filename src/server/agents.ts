import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { hashAgentToken, isAgentTokenFormat } from "./crypto";
import type { Database } from "./db";
import { agents } from "./db/schema";

export interface ActiveAgent {
  id: string;
  name: string;
  client: (typeof agents.$inferSelect)["client"];
  trusted: boolean;
}

/** The agent a bearer token belongs to, or null if the token is unknown, malformed or revoked. */
export async function findActiveAgentByToken(db: Database, token: string): Promise<ActiveAgent | null> {
  // Reject garbage before touching the database.
  if (!isAgentTokenFormat(token)) return null;

  const [agent] = await db
    .select({ id: agents.id, name: agents.name, client: agents.client, trusted: agents.trusted })
    .from(agents)
    .where(and(eq(agents.tokenHash, hashAgentToken(token)), isNull(agents.revokedAt)))
    .limit(1);
  if (!agent) return null;

  await db.update(agents).set({ lastUsedAt: new Date() }).where(eq(agents.id, agent.id));
  return agent;
}
