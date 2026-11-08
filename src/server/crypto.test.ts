import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, generateAgentToken, hashAgentToken, isAgentTokenFormat } from "./crypto";

const key = randomBytes(32);

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const sealed = encryptSecret("linkedin-access-token", key);
    expect(sealed).not.toContain("linkedin-access-token");
    expect(decryptSecret(sealed, key)).toBe("linkedin-access-token");
  });

  it("uses a fresh IV every time", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("rejects a tampered ciphertext", () => {
    const [format, iv, tag, ciphertext] = encryptSecret("secret", key).split(".");
    const flipped = Buffer.from(ciphertext, "base64url");
    flipped[0] ^= 1;
    expect(() => decryptSecret([format, iv, tag, flipped.toString("base64url")].join("."), key)).toThrow();
  });

  it("rejects the wrong key", () => {
    expect(() => decryptSecret(encryptSecret("secret", key), randomBytes(32))).toThrow();
  });

  it("rejects keys that are not 32 bytes", () => {
    expect(() => encryptSecret("secret", randomBytes(16))).toThrow(/32 bytes/);
  });

  it("rejects values that are not in the v1 format", () => {
    expect(() => decryptSecret("plain-text", key)).toThrow(/v1 format/);
  });
});

describe("agent tokens", () => {
  it("generates well-formed, unique tokens and stores only a hash", () => {
    const first = generateAgentToken();
    const second = generateAgentToken();
    expect(isAgentTokenFormat(first.token)).toBe(true);
    expect(first.token).not.toBe(second.token);
    expect(first.hash).toBe(hashAgentToken(first.token));
    expect(first.hash).not.toContain(first.token);
    expect(first.token.startsWith(first.prefix)).toBe(true);
  });

  it("rejects malformed tokens", () => {
    expect(isAgentTokenFormat("")).toBe(false);
    expect(isAgentTokenFormat("lah_short")).toBe(false);
    expect(isAgentTokenFormat(`xyz_${"a".repeat(43)}`)).toBe(false);
  });
});
