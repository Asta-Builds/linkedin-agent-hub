import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { databaseUrl, tokenEncryptionKey } from "./env";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("tokenEncryptionKey", () => {
  it("decodes a 32-byte base64 key", () => {
    const key = randomBytes(32);
    process.env.TOKEN_ENCRYPTION_KEY = key.toString("base64");
    expect(tokenEncryptionKey().equals(key)).toBe(true);
  });

  it("rejects a key of the wrong length and names the variable, never the value", () => {
    const value = randomBytes(16).toString("base64");
    process.env.TOKEN_ENCRYPTION_KEY = value;
    expect(() => tokenEncryptionKey()).toThrow(/TOKEN_ENCRYPTION_KEY/);
    try {
      tokenEncryptionKey();
    } catch (error) {
      expect(String(error)).not.toContain(value);
    }
  });

  it("rejects a missing key", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => tokenEncryptionKey()).toThrow(/TOKEN_ENCRYPTION_KEY is missing or invalid/);
  });
});

describe("databaseUrl", () => {
  it("accepts a Postgres URL and rejects anything else", () => {
    process.env.DATABASE_URL = "postgres://user@db.example.invalid:5432/app";
    expect(databaseUrl()).toBe("postgres://user@db.example.invalid:5432/app");
    process.env.DATABASE_URL = "mysql://user@db.example.invalid/app";
    expect(() => databaseUrl()).toThrow(/DATABASE_URL/);
  });
});
