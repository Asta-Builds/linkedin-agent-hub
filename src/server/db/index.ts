import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseUrl } from "../env";
import * as schema from "./schema";

function createDb() {
  // One small pool per function instance; Fluid Compute reuses instances across requests.
  const pool = new Pool({ connectionString: databaseUrl(), max: 5 });
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDb>;

let db: Database | undefined;

/** The database, created on first use so that `next build` never needs DATABASE_URL. */
export function getDb(): Database {
  db ??= createDb();
  return db;
}
