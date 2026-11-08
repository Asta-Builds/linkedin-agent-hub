import { testDatabase } from "./fixtures";

export default async function globalTeardown(): Promise<void> {
  const name = process.env.E2E_AGENT_NAME;
  if (!name) return;
  const db = testDatabase();
  try {
    await db.query("delete from agents where name = $1", [name]);
  } finally {
    await db.end();
  }
}
