import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/server/db";

export async function GET(): Promise<Response> {
  // Request time only: a prerendered health check would say nothing about the database.
  await connection();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, database: "up" });
  } catch {
    return Response.json({ ok: false, database: "down" }, { status: 503 });
  }
}
