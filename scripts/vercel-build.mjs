// Vercel's build entry point (package.json "vercel-build"): migrate, then build.
//
// Only production builds migrate. A preview deployment builds an unmerged PR, and its
// migration must never reach the production database before the owner approves it.

import { execSync } from "node:child_process";

const environment = process.env.VERCEL_ENV ?? "unset";

if (environment === "production") {
  process.stdout.write("vercel-build: applying migrations to the production database\n");
  execSync("npx drizzle-kit migrate", { stdio: "inherit" });
} else {
  process.stdout.write(`vercel-build: VERCEL_ENV=${environment}, so migrations are skipped\n`);
}

execSync("npx next build", { stdio: "inherit" });
