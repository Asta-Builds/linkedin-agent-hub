import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { findActiveAgentByToken } from "./agents";
import { generateAgentToken } from "./crypto";
import { getDb } from "./db";
import { agents } from "./db/schema";
import { verifyAgentToken } from "./mcp/auth";

// Needs a migrated Postgres (CI provides one; locally: DATABASE_URL in the environment).
describe.runIf(process.env.DATABASE_URL)("agent tokens against the database", () => {
  const created: string[] = [];

  async function createAgent(revoked = false) {
    const { token, hash, prefix } = generateAgentToken();
    const [row] = await getDb()
      .insert(agents)
      .values({ name: `test-${prefix}`, client: "codex", tokenHash: hash, tokenPrefix: prefix, revokedAt: revoked ? new Date() : null })
      .returning({ id: agents.id });
    created.push(row.id);
    return { id: row.id, token };
  }

  afterAll(async () => {
    for (const id of created) await getDb().delete(agents).where(eq(agents.id, id));
  });

  it("finds an active agent by its token and records when it was used", async () => {
    const { id, token } = await createAgent();
    const agent = await findActiveAgentByToken(getDb(), token);
    expect(agent).toMatchObject({ id, client: "codex", trusted: false });
    const [row] = await getDb().select({ lastUsedAt: agents.lastUsedAt }).from(agents).where(eq(agents.id, id));
    expect(row.lastUsedAt).toBeInstanceOf(Date);
  });

  it("rejects revoked, unknown and malformed tokens", async () => {
    const { token } = await createAgent(true);
    expect(await findActiveAgentByToken(getDb(), token)).toBeNull();
    expect(await findActiveAgentByToken(getDb(), generateAgentToken().token)).toBeNull();
    expect(await findActiveAgentByToken(getDb(), "not-a-token")).toBeNull();
  });

  it("gives the MCP endpoint the agent and its scopes, never more", async () => {
    const { id, token } = await createAgent();
    const auth = await verifyAgentToken(new Request("http://localhost/api/mcp"), token);
    expect(auth).toMatchObject({ clientId: id, scopes: ["profile:read", "drafts:write"] });
    expect(await verifyAgentToken(new Request("http://localhost/api/mcp"), undefined)).toBeUndefined();
  });
});
