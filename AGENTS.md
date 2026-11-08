<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LinkedIn Agent Hub: rules for every agent

These rules apply to every coding agent working in this repository: Claude Code, Codex,
Antigravity, and the factory's implementer in CI. `CLAUDE.md` imports this file.

## 1. What the app is

A single-owner Next.js 16 app on Vercel. The owner connects their LinkedIn account. AI agents
call the MCP endpoint `/api/mcp`, each with its own bearer token, to **draft** LinkedIn posts and
rewrites of the owner's headline, About and experience. The owner approves each post, and only
then does the app publish it through LinkedIn's official API.

What LinkedIn allows a self-serve app, and so what this app can do:

| Capability | LinkedIn permission | In this app |
|---|---|---|
| Sign in, read name, photo, email | `openid profile email` | Owner sign-in and profile card |
| Publish a post as the member | `w_member_social` (Share on LinkedIn) | Approved posts are published |
| Edit headline, About, experience | Partner-only (Profile Edit API) | Agents write suggestions; the owner pastes them in by hand |
| Read the member's post history | Partner-only (`r_member_social`) | Not available: the app keeps its own record of what it published |

Access tokens last 60 days and self-serve apps get no refresh token, so the app must warn the
owner before expiry and offer to reconnect.

## 2. Never

1. **Never automate linkedin.com**: no scraping, no browser automation, no unofficial endpoints.
   Only the official API (`api.linkedin.com/v2`, `api.linkedin.com/rest`, `www.linkedin.com/oauth`),
   and only from `src/server/linkedin/`. ESLint blocks other linkedin.com URLs.
2. **Agents never publish.** MCP tools create, edit and delete the calling agent's own drafts and
   suggestions. Publishing happens only when the owner approves in the dashboard. Leave
   `agents.trusted` unused until the owner asks for it.
3. **Never hardcode, log or return a secret**: no tokens, `Authorization` headers, LinkedIn access
   tokens, client secrets or encryption keys in code, logs, errors, audit entries or tool results.
4. **Store secrets only in their protected form.** LinkedIn tokens go through `encryptSecret` with
   `tokenEncryptionKey()`. Agent tokens are stored as `hashAgentToken` plus a short prefix and shown
   to the owner exactly once.
5. **Never ship server code to the browser.** Modules in `src/server/` start with
   `import "server-only"`, except `crypto.ts` and `db/schema.ts`, which tests and drizzle-kit
   import directly. `src/components/` may not import server modules (ESLint enforces this).
6. **Never edit an applied migration** in `drizzle/`. Change `src/server/db/schema.ts`, then run
   `npm run db:generate` and commit the new file.
7. **Never weaken a gate to get a change through**: not the ESLint config, knip, jscpd, Gitleaks,
   CODEOWNERS or the workflows. If a gate is wrong, say so in the PR and let the owner change it.
8. **Never commit `.env` files**, and never paste real credentials into issues, PRs or tests.

## 3. Where things go

| Path | What lives there |
|---|---|
| `src/app/` | Pages and route handlers. Server Components by default. |
| `src/app/api/mcp/route.ts` | The MCP endpoint. Tools are registered in `src/server/mcp/`. |
| `src/server/` | All server logic: `env.ts`, `db/`, `crypto.ts`, `agents.ts`, `audit.ts`, `mcp/`, and `linkedin/` (the API client, to be built). |
| `src/components/` | UI components. No database or secrets. |
| `e2e/` | Playwright journeys. |
| `drizzle/` | Generated SQL migrations. |

- **Data:** use `getDb()` from `src/server/db`. Make each change in one transaction, and call
  `recordAudit` inside that transaction with actor `owner`, `agent:<id>` or `system`. Audit
  details never contain secrets or full post bodies.
- **MCP tools:** register them from `src/server/mcp/`, and split by area once a file nears 300 lines.
  Validate every input with a zod `inputSchema`. Get the caller with
  `agentFromAuth(ctx.http?.authInfo)`. An agent may only see and change its own drafts. Return
  `structuredContent` alongside the text.
- **Owner auth (to be built):** sign-in with LinkedIn (OpenID Connect). Only the member whose `sub`
  equals `OWNER_LINKEDIN_SUB` may sign in. Every owner-only page, route handler and Server Action
  checks the session on the server; `proxy.ts` alone is not enough.
- **Next.js 16:** Cache Components are on, so request-time data belongs inside `<Suspense>`.
  Middleware is `proxy.ts`. Read the guide in `node_modules/next/dist/docs/` before using an API.
- **LinkedIn calls:** all go through one client in `src/server/linkedin/`, so tests can stub
  `fetch`. Send the `LinkedIn-Version` header the Posts API requires.

## 4. Gates: run them before you finish

```bash
npm run check   # ESLint (0 warnings), types, knip, jscpd, migration check, unit and DB tests
npm run build   # production build
npm run test:e2e   # Playwright; needs DATABASE_URL (migrated, throwaway) and a build
```

ESLint enforces: complexity ≤ 15, ≤ 300 lines per file, nesting depth ≤ 4, ≤ 4 parameters,
no `any`, no `console.log`, the import boundaries above, and the LinkedIn URL rule. CI runs all of
this plus the secret scan (Gitleaks and an AI reviewer) and E2E, and every check is required to
merge.

## 5. Tests

- Put unit tests next to the code as `*.test.ts` (Vitest). Tests that need the database use
  `describe.runIf(process.env.DATABASE_URL)` and delete the rows they create.
- Every user-facing flow gets a Playwright journey in `e2e/`. Tag it `@smoke` if every PR should
  run it. Mock only LinkedIn's HTTP API, never this app's own database or routes.
- A bug fix comes with a test that fails without the fix.

## 6. Running it locally

```bash
npm ci
cp .env.example .env.local      # or: vercel env pull .env.local --yes
npm run db:migrate
npm run dev                     # http://localhost:3000
```

For a throwaway database:
`docker run -d --rm --name lah-pg -e POSTGRES_USER=lah -e POSTGRES_PASSWORD=test_password -e POSTGRES_DB=lah_test -p 127.0.0.1:5632:5432 postgres:17-alpine`,
then use `DATABASE_URL=postgres://lah:test_password@localhost:5632/lah_test`.

## 7. Done means

- The issue's acceptance criteria are met, and nothing outside its scope changed.
- `npm run check` and `npm run build` pass, and E2E passes for any flow you touched.
- New behavior has tests, and new environment variables are added to `.env.example` and the README.
- The PR explains what changed and anything the owner must do by hand, such as a new Vercel
  environment variable or a LinkedIn app setting.
