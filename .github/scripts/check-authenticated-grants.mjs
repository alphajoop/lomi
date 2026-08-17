#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = path.join(
  root,
  "apps/dashboard/scripts/db/check/check-authenticated-grants.mjs",
);
if (!existsSync(script)) {
  console.error(`Missing dashboard grant check at ${script}`);
  process.exit(2);
}
const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 2);
