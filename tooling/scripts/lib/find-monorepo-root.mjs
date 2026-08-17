import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function findMonorepoRoot(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    if (
      existsSync(path.join(dir, "tooling/tasks.json")) &&
      existsSync(path.join(dir, "tooling/scripts/workspace.mjs"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function thisFileDir(metaUrl) {
  return path.dirname(fileURLToPath(metaUrl));
}
