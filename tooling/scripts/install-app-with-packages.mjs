#!/usr/bin/env node

/**
 * Install a monorepo app plus `@lomi./` packages for Vercel/CI.
 *
 * Root `package.json` / `pnpm-lock.yaml` are gitignored (local anti-slop),
 * so Git clones and umbrella uploads cannot `pnpm install` at the repo root.
 * Docs/website use `file:../../packages/*` and must pass `--ignore-workspace`
 * so the parent `pnpm-workspace.yaml` does not swallow the install.
 * Admin/dashboard use `workspace:*`; the installer rewrites those to `file:`
 * for this run so Vercel does not need a root workspace. Pin pnpm 9: Vercel
 * website/admin projects are Node 24, and pnpm 10's registry client hits
 * ERR_INVALID_THIS there.
 *
 * Usage: node tooling/scripts/install-app-with-packages.mjs <app-dir>
 *   e.g. node tooling/scripts/install-app-with-packages.mjs apps/docs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PACKAGE_INSTALL_ORDER = [
  "packages/shared",
  "packages/ui",
  "packages/queries",
  "packages/receipt-pdf",
];

const FILE_SPEC_TO_DIR = {
  "@lomi./shared": "packages/shared",
  "@lomi./ui": "packages/ui",
  "@lomi./queries": "packages/queries",
  "@lomi./receipt-pdf": "packages/receipt-pdf",
};

let pnpmInvocation = ["pnpm"];

function run(command, args, cwd) {
  console.log(`==> (${path.relative(ROOT, cwd) || "."}) ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  const status = result.status ?? 1;
  if (status !== 0) process.exit(status);
}

function runPnpm(args, cwd) {
  run(pnpmInvocation[0], [...pnpmInvocation.slice(1), ...args], cwd);
}

function readPackage(dir) {
  return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
}

function dependencyMap(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

function neededPackageDirs(pkg) {
  const deps = dependencyMap(pkg);
  return PACKAGE_INSTALL_ORDER.filter((dir) => {
    const name = Object.keys(FILE_SPEC_TO_DIR).find(
      (key) => FILE_SPEC_TO_DIR[key] === dir,
    );
    return Boolean(name && deps[name]);
  });
}

function enablePnpm9() {
  const result = spawnSync(
    "corepack",
    ["prepare", "pnpm@9.15.9", "--activate"],
    { cwd: ROOT, stdio: "inherit", env: process.env },
  );
  if ((result.status ?? 1) === 0) return;
  console.log("==> corepack prepare failed; using npx pnpm@9.15.9");
  pnpmInvocation = ["npx", "--yes", "pnpm@9.15.9"];
}

function rewriteWorkspaceSpecsToFile(appDir) {
  const pkgPath = path.join(appDir, "package.json");
  const pkg = readPackage(appDir);
  let changed = false;
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (!String(spec).startsWith("workspace:")) continue;
      const dir = FILE_SPEC_TO_DIR[name];
      if (!dir) {
        console.error(`no file: mapping for workspace dep ${name}`);
        process.exit(1);
      }
      let rel = path.relative(appDir, path.join(ROOT, dir));
      if (!rel.startsWith(".")) rel = `./${rel}`;
      deps[name] = `file:${rel}`;
      changed = true;
    }
  }
  if (!changed) return { pkg, rewritten: false };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(
    `==> rewrote workspace:* to file: in ${path.relative(ROOT, pkgPath)}`,
  );
  return { pkg, rewritten: true };
}

function installFileApp(appRel, pkg, { frozen }) {
  const appDir = path.join(ROOT, appRel);
  for (const rel of neededPackageDirs(pkg)) {
    const dir = path.join(ROOT, rel);
    runPnpm(["install", "--ignore-workspace"], dir);
    const packageJson = readPackage(dir);
    if (packageJson.scripts?.build) {
      runPnpm(["run", "build"], dir);
    }
  }

  const args = ["install", "--ignore-workspace"];
  if (frozen && existsSync(path.join(appDir, "pnpm-lock.yaml"))) {
    args.push("--frozen-lockfile");
  }
  runPnpm(args, appDir);
}

function main() {
  const appRel = process.argv[2];
  if (!appRel) {
    console.error(
      "usage: node tooling/scripts/install-app-with-packages.mjs <app-dir>",
    );
    process.exit(2);
  }

  const appDir = path.join(ROOT, appRel);
  if (!existsSync(path.join(appDir, "package.json"))) {
    console.error(`missing ${appRel}/package.json`);
    process.exit(1);
  }

  enablePnpm9();

  const { pkg, rewritten } = rewriteWorkspaceSpecsToFile(appDir);
  installFileApp(appRel, pkg, { frozen: !rewritten });
}

main();
