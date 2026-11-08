import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Pure helpers with no environment access, so tests and scripts can import them.
// Client bundles cannot: `node:crypto` does not exist in the browser.

const CIPHER = "aes-256-gcm";
const FORMAT = "v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

const AGENT_TOKEN_PREFIX = "lah_";
const AGENT_TOKEN_BYTES = 32;
const AGENT_TOKEN_PATTERN = /^lah_[A-Za-z0-9_-]{43}$/;

function assertKey(key: Buffer): void {
  if (key.length !== KEY_BYTES) {
    throw new Error(`Encryption key must be ${KEY_BYTES} bytes, got ${key.length}.`);
  }
}

/** Encrypts a secret (for example a LinkedIn access token) for storage at rest. */
export function encryptSecret(plaintext: string, key: Buffer): string {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [FORMAT, iv, tag, ciphertext].map((part) => (typeof part === "string" ? part : part.toString("base64url"))).join(".");
}

/** Decrypts a value from `encryptSecret`. Throws if it was tampered with or the key is wrong. */
export function decryptSecret(payload: string, key: Buffer): string {
  assertKey(key);
  const [format, iv, tag, ciphertext] = payload.split(".");
  if (format !== FORMAT || !iv || !tag || ciphertext === undefined) {
    throw new Error("Not an encrypted secret in the v1 format.");
  }
  const decipher = createDecipheriv(CIPHER, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

/**
 * Agent tokens are 256-bit random values, so an unsalted SHA-256 is enough to store
 * them: only the hash is kept, and lookups compare hashes, never the token itself.
 */
export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isAgentTokenFormat(token: string): boolean {
  return AGENT_TOKEN_PATTERN.test(token);
}

/** A new agent token. Show `token` to the owner once; store only `hash` and `prefix`. */
export function generateAgentToken(): { token: string; hash: string; prefix: string } {
  const token = AGENT_TOKEN_PREFIX + randomBytes(AGENT_TOKEN_BYTES).toString("base64url");
  return { token, hash: hashAgentToken(token), prefix: token.slice(0, AGENT_TOKEN_PREFIX.length + 6) };
}
