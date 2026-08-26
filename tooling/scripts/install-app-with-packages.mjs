#!/usr/bin/env node

/**
 * Install a monorepo app plus `@lomi./` packages for Vercel/CI.
 *
 * Root `package.json` / `pnpm-lock.yaml` are gitignored (local anti-slop),
 * so Git clones and umbrella uploads cannot `pnpm install` at the repo root.
 * Docs/website use `file:../../packages/*` and must pass `--ignore-workspace`
 * so the parent `pnpm-workspace.yaml` does not swallow the install.
 * Admin/dashboard use `workspace:*` and need an ephemeral root manifest.
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

function readPackage(dir) {
  return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
}

function dependencyMap(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

function usesWorkspaceProtocol(pkg) {
  return Object.values(dependencyMap(pkg)).some((spec) =>
    String(spec).startsWith("workspace:"),
  );
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

function ensureWorkspaceRoot() {
  const pkgPath = path.join(ROOT, "package.json");
  if (!existsSync(pkgPath)) {
    writeFileSync(
      pkgPath,
      `${JSON.stringify(
        {
          name: "lomi-umbrella",
          private: true,
          packageManager: "pnpm@10.14.0",
        },
        null,
        2,
      )}\n`,
    );
    console.log("==> wrote ephemeral root package.json for workspace install");
  }

  const dashboardPkg = path.join(ROOT, "apps/dashboard/package.json");
  const adminPkg = path.join(ROOT, "apps/admin/package.json");
  if (existsSync(dashboardPkg) && existsSync(adminPkg)) return;

  const members = ["packages/*", "!packages/pay"];
  if (existsSync(dashboardPkg)) members.push("apps/dashboard");
  if (existsSync(adminPkg)) members.push("apps/admin");
  writeFileSync(
    path.join(ROOT, "pnpm-workspace.yaml"),
    `packages:\n${members.map((entry) => `  - "${entry}"\n`).join("")}`,
  );
  console.log("==> narrowed pnpm-workspace.yaml to present workspace members");
}

function installWorkspaceApp(appRel, pkg) {
  ensureWorkspaceRoot();
  run("pnpm", ["install", "--filter", `${pkg.name}...`], ROOT);
}

function installFileApp(appRel, pkg) {
  const appDir = path.join(ROOT, appRel);
  for (const rel of neededPackageDirs(pkg)) {
    const dir = path.join(ROOT, rel);
    run("pnpm", ["install", "--ignore-workspace"], dir);
    const packageJson = readPackage(dir);
    if (packageJson.scripts?.build) {
      run("pnpm", ["run", "build"], dir);
    }
  }

  const args = ["install", "--ignore-workspace"];
  if (existsSync(path.join(appDir, "pnpm-lock.yaml"))) {
    args.push("--frozen-lockfile");
  }
  run("pnpm", args, appDir);
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

  const pkg = readPackage(appDir);
  if (usesWorkspaceProtocol(pkg)) {
    installWorkspaceApp(appRel, pkg);
    return;
  }
  installFileApp(appRel, pkg);
}

main();
