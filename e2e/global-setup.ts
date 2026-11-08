import { randomUUID } from "node:crypto";
import { generateAgentToken } from "../src/server/crypto";
import { testDatabase } from "./fixtures";

/** Creates one agent with a fresh token for this run; see e2eAgent() in fixtures.ts. */
export default async function globalSetup(): Promise<void> {
  const name = `e2e-agent-${randomUUID().slice(0, 8)}`;
  const { token, hash, prefix } = generateAgentToken();
  const db = testDatabase();
  try {
    await db.query("insert into agents (name, client, token_hash, token_prefix) values ($1, 'claude', $2, $3)", [
      name,
      hash,
      prefix,
    ]);
  } finally {
    await db.end();
  }
  process.env.E2E_AGENT_NAME = name;
  process.env.E2E_AGENT_TOKEN = token;
}
