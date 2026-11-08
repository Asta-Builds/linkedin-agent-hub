# LinkedIn Agent Hub

Let your AI agents (Codex, Claude Code, Antigravity, or any MCP client) draft LinkedIn posts
and rewrites of your headline, About and experience. **Nothing is published until you approve it.**

- **Agents** connect to one MCP endpoint, `/api/mcp`, each with its own revocable token.
- **You** review drafts in the dashboard. Approved posts go out through LinkedIn's official API.
  Profile rewrites are copied into LinkedIn by you, since LinkedIn doesn't let apps edit profiles.
- **Everything** an agent or you change is recorded in an audit log.

Built with Next.js 16 on Vercel, Postgres (Neon) through Drizzle, and `mcp-handler`.

## Status

The skeleton is in place: the MCP endpoint with token auth and a `whoami` tool, the database
schema, encryption for LinkedIn tokens, and the factory's gates and CI. Features arrive as
tickets the factory agent implements (see [Factory](#factory)).

## Connecting an agent

Each agent needs a token (`lah_...`) from the dashboard. Treat it like a password. Replace
`https://YOUR-APP.vercel.app` with your deployment.

**Claude Code**

```bash
claude mcp add --transport http linkedin-hub https://YOUR-APP.vercel.app/api/mcp \
  --header "Authorization: Bearer $LINKEDIN_HUB_TOKEN"
```

**Codex** (`~/.codex/config.toml`)

```toml
[mcp_servers.linkedin-hub]
url = "https://YOUR-APP.vercel.app/api/mcp"
bearer_token_env_var = "LINKEDIN_HUB_TOKEN"
```

**Antigravity** (`mcp_config.json`)

```json
{
  "mcpServers": {
    "linkedin-hub": {
      "serverUrl": "https://YOUR-APP.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer lah_..." }
    }
  }
}
```

Ask the agent to call `whoami` to check the connection.

## Environment variables

| Name | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string. Set by the Neon integration on Vercel. |
| `TOKEN_ENCRYPTION_KEY` | 32 random bytes, base64 (`openssl rand -base64 32`). Encrypts LinkedIn tokens at rest. |

The LinkedIn sign-in ticket adds `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` and
`OWNER_LINKEDIN_SUB`. Set real values in Vercel (Settings → Environment Variables), never in git.

## Development

See [AGENTS.md](AGENTS.md) for the rules, the layout and the commands. In short:

```bash
npm ci
cp .env.example .env.local   # then fill it in, or: vercel env pull .env.local --yes
npm run db:migrate
npm run dev
npm run check                # every gate CI runs, except the build and E2E
git config core.hooksPath .githooks   # once per clone: lint and secret scan on commit
```

## Factory

This repository is built by the software factory. A one-line idea in the Control Room becomes
a refined GitHub issue. Labeling it `agent` runs `.github/workflows/agent-implementer.yml`: Claude
implements it, the gates re-check it, and a PR opens. Its checks run automatically: CI, the
secret scan and E2E, all required. Every PR needs the owner's review, and Vercel deploys main.
