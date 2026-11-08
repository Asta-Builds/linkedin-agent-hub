import { bigserial, boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// No `server-only` here: drizzle-kit reads this file outside Next.js to generate migrations.
// Change it only together with a generated migration (`npm run db:generate`).

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const agentClient = pgEnum("agent_client", ["codex", "claude", "antigravity", "other"]);
export const postStatus = pgEnum("post_status", ["pending", "approved", "rejected", "published", "failed"]);
export const profileSection = pgEnum("profile_section", ["headline", "about", "experience"]);
export const suggestionStatus = pgEnum("suggestion_status", ["new", "applied", "dismissed"]);

/** The owner's LinkedIn connection. Single-owner app: at most one row, id "owner". */
export const linkedinConnection = pgTable("linkedin_connection", {
  id: text("id").primaryKey().default("owner"),
  memberSub: text("member_sub").notNull(),
  name: text("name"),
  email: text("email"),
  pictureUrl: text("picture_url"),
  /** Encrypted with TOKEN_ENCRYPTION_KEY (see src/server/crypto.ts). Never store it in plain text. */
  accessTokenEnc: text("access_token_enc").notNull(),
  scopes: text("scopes").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  connectedAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An AI agent (Codex, Claude, Antigravity, ...) allowed to call the MCP endpoint. */
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  client: agentClient("client").notNull().default("other"),
  /** SHA-256 of the bearer token. The token itself is shown once and never stored. */
  tokenHash: text("token_hash").notNull().unique(),
  /** First characters of the token, so the owner can tell tokens apart. */
  tokenPrefix: text("token_prefix").notNull(),
  /** Reserved: trusted agents may later publish without approval. Off for every agent today. */
  trusted: boolean("trusted").notNull().default(false),
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

/** A LinkedIn post. Agents create it as `pending`; only the owner moves it on. */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    status: postStatus("status").notNull().default("pending"),
    linkedinPostUrn: text("linkedin_post_urn"),
    error: text("error"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [index("posts_status_idx").on(table.status)],
);

/** A rewrite of a profile section. LinkedIn's API cannot edit profiles, so the owner applies it by hand. */
export const profileSuggestions = pgTable("profile_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  section: profileSection("section").notNull(),
  /** For an experience entry: which role it rewrites. */
  title: text("title"),
  body: text("body").notNull(),
  rationale: text("rationale"),
  status: suggestionStatus("status").notNull().default("new"),
  createdAt: createdAt(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

/** Every change made by the owner, an agent or the system. Append-only. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    /** "owner", "agent:<uuid>" or "system". */
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    target: text("target"),
    detail: jsonb("detail"),
  },
  (table) => [index("audit_log_at_idx").on(table.at)],
);
