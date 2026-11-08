import "server-only";
import { z } from "zod";

// Server configuration, read lazily so `next build` works before the variables exist.
// Values come from Vercel (Settings > Environment Variables) or `.env.local` in development.

const databaseUrlSchema = z.url({ protocol: /^postgres(ql)?$/ });
const encryptionKeySchema = z
  .string()
  .transform((value) => Buffer.from(value, "base64"))
  .refine((key) => key.length === 32, "TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32).");

function read<T>(name: string, schema: z.ZodType<T, string>): T {
  const result = schema.safeParse(process.env[name]);
  if (!result.success) {
    // Name the variable, never its value.
    throw new Error(`${name} is missing or invalid: ${result.error.issues[0]?.message ?? "invalid"}`);
  }
  return result.data;
}

export function databaseUrl(): string {
  return read("DATABASE_URL", databaseUrlSchema);
}

/** Key for encrypting LinkedIn tokens at rest. */
export function tokenEncryptionKey(): Buffer {
  return read("TOKEN_ENCRYPTION_KEY", encryptionKeySchema);
}
