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
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
