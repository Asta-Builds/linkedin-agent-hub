import "server-only";
import type { Database } from "./db";
import { auditLog } from "./db/schema";

type AuditActor = "owner" | "system" | `agent:${string}`;

export interface AuditEntry {
  actor: AuditActor;
  action: string;
  target?: string;
  /** Never put tokens, secrets or full post bodies here. */
  detail?: Record<string, unknown>;
}

/** Appends one entry. Call it inside the same transaction as the change it records. */
export async function recordAudit(db: Pick<Database, "insert">, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    actor: entry.actor,
    action: entry.action,
    target: entry.target ?? null,
    detail: entry.detail ?? null,
  });
}
