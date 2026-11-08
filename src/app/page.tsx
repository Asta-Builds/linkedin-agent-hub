const steps = [
  {
    title: "Connect LinkedIn",
    body: "Sign in with LinkedIn so the hub can read your basic profile and publish the posts you approve.",
  },
  {
    title: "Add your agents",
    body: "Give Codex, Claude Code or Antigravity its own token for the MCP endpoint at /api/mcp. Revoke it at any time.",
  },
  {
    title: "Approve what goes live",
    body: "Agents only write drafts: posts, and rewrites of your headline, About and experience. You decide what is published.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">LinkedIn Agent Hub</h1>
        <p className="max-w-prose text-lg text-zinc-600 dark:text-zinc-400">
          Your AI agents draft LinkedIn posts and profile rewrites. Nothing is published until you approve it.
        </p>
      </header>
      <ol className="flex flex-col gap-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium dark:border-zinc-700">
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-medium">{step.title}</h2>
              <p className="text-zinc-600 dark:text-zinc-400">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
