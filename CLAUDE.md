@AGENTS.md

## Notes for Claude Code

- The rules above are shared by every agent; this file only adds Claude-specific notes.
- In CI you run as the factory's implementer (`.github/workflows/agent-implementer.yml`). Your
  work is re-checked by the same gates after you finish, then opened as a PR for the owner.
- Use the bundled Next.js docs in `node_modules/next/dist/docs/` rather than memory for any
  Next.js 16 API.
