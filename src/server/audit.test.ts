import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { recordAudit } from "./audit";
import { getDb } from "./db";
import { auditLog } from "./db/schema";

describe.runIf(process.env.DATABASE_URL)("recordAudit", () => {
  it("appends an entry, inside the caller's transaction", async () => {
    const action = `test.audit.${Date.now()}`;
    await getDb().transaction(async (tx) => {
      await recordAudit(tx, { actor: "system", action, target: "post:test", detail: { reason: "unit test" } });
    });
    const rows = await getDb().select().from(auditLog).where(eq(auditLog.action, action));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ actor: "system", target: "post:test", detail: { reason: "unit test" } });
    await getDb().delete(auditLog).where(eq(auditLog.action, action));
  });

  it("is rolled back with a failed transaction", async () => {
    const action = `test.audit.rollback.${Date.now()}`;
    await expect(
      getDb().transaction(async (tx) => {
        await recordAudit(tx, { actor: "system", action });
        throw new Error("change failed");
      }),
    ).rejects.toThrow("change failed");
    expect(await getDb().select().from(auditLog).where(eq(auditLog.action, action))).toHaveLength(0);
  });
});
