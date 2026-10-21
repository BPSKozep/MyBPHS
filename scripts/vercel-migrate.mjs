// Runs pending MongoDB migrations during the Vercel build (`vercel-build` script).
// Only the dev and main branches migrate; PR previews share the dev database and
// must not apply migrations from unmerged branches. A failed migration fails the
// build, so the previous deployment stays live.

import { spawnSync } from "node:child_process";

const MIGRATE_BRANCHES = ["dev", "main"];
const branch = process.env.VERCEL_GIT_COMMIT_REF;

if (!branch || !MIGRATE_BRANCHES.includes(branch)) {
  console.log(
    `[migrate] Skipping migrations on branch "${branch ?? "unknown"}"`,
  );
  process.exit(0);
}

console.log(`[migrate] Running migrations for branch "${branch}"`);
const result = spawnSync("pnpm", ["migrate", "up"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("[migrate] Migrations failed, aborting build");
  process.exit(result.status ?? 1);
}
