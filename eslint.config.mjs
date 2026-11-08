import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Factory gates (CLAUDE.md section 2). CI runs `npm run lint`, which allows zero warnings.

const serverOnlyModules = {
  patterns: [
    { group: ["@/server", "@/server/*", "**/server/*"], message: "UI code must not import server modules. Call a Server Action or route instead." },
  ],
  paths: [
    { name: "pg", message: "Database access lives in src/server only." },
    { name: "drizzle-orm", message: "Database access lives in src/server only." },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Size and complexity limits keep every file small enough for an agent to change safely.
    files: ["**/*.{ts,tsx,mts,mjs}"],
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 4],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Shared UI never touches the database or secrets directly.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", serverOnlyModules] },
  },
  {
    // LinkedIn is reached only through its official REST API from src/server/linkedin.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/linkedin/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/linkedin\\.com\\/(?!oauth|v2|rest)/]",
          message: "Only the official LinkedIn API (oauth, v2, rest) is allowed, from src/server/linkedin. Never automate linkedin.com.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
