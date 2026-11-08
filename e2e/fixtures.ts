import { Pool } from "pg";

/**
 * The agent global-setup creates for this run. Setup and tests run in different
 * processes, so its name and token travel through environment variables.
 */
export function e2eAgent(): { name: string; token: string } {
  const name = process.env.E2E_AGENT_NAME;
  const token = process.env.E2E_AGENT_TOKEN;
  if (!name || !token) throw new Error("e2e/global-setup.ts did not run.");
  return { name, token };
}

export function testDatabase(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("E2E needs DATABASE_URL pointing at a migrated, throwaway database.");
  return new Pool({ connectionString, max: 1 });
}
