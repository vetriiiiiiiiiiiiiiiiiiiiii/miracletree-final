/**
 * Flips the Prisma datasource between SQLite and PostgreSQL.
 *
 * Prisma requires `provider` to be a literal string — it cannot read env() —
 * so moving to Postgres genuinely means editing the schema. This does that one
 * edit, so it is a command rather than a manual step someone forgets before a
 * deploy and then debugs for an hour.
 *
 *   node scripts/use-postgres.mjs          # -> postgresql
 *   node scripts/use-postgres.mjs sqlite   # -> back to local sqlite
 *
 * Everything else in the schema is already provider-neutral: no native enums,
 * no scalar lists, no provider-specific column types. Case-insensitive search
 * is handled at runtime by `insensitive` in src/lib/prisma.ts, which is the one
 * behavioural difference between the two that would otherwise bite silently.
 */
import { readFileSync, writeFileSync } from "node:fs";

const target = (process.argv[2] ?? "postgresql").toLowerCase();
const provider = target === "sqlite" ? "sqlite" : "postgresql";

const path = "prisma/schema.prisma";
const before = readFileSync(path, "utf8");
const after = before.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"(sqlite|postgresql)"/s,
  `$1"${provider}"`,
);

if (before === after) {
  console.log(`already on ${provider}`);
} else {
  writeFileSync(path, after);
  console.log(`datasource provider -> ${provider}`);
  console.log("next: npx prisma db push && npm run db:seed");
}
