import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local by itself (Next.js does). `vercel env pull` writes it.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: CI and Vercel set DATABASE_URL in the environment.
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations use Neon's direct connection when it exists: the pooler (PgBouncer) does
  // not support everything a migration does. The app itself uses the pooled DATABASE_URL.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
