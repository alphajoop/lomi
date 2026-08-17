#!/usr/bin/env node
/**
 * Generate the canonical production Database types.
 * Writes packages/shared/src/database.ts only after the output looks valid.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROD_PROJECT_ID = "mdswvokxrnfggrujsfjd";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../src/database.ts");

function generate() {
  return execFileSync(
    "supabase",
    ["gen", "types", "typescript", "--project-id", PROD_PROJECT_ID],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
}

function assertValidTypes(source) {
  if (!source.includes("export type Database")) {
    throw new Error("Generated types are missing `export type Database`");
  }
  if (!source.includes("  public: {")) {
    throw new Error("Generated types are missing the public schema block");
  }
  if (source.trim().length < 10_000) {
    throw new Error("Generated types are unexpectedly short");
  }
}

const output = generate();
assertValidTypes(output);

const tmpPath = `${outPath}.tmp`;
fs.writeFileSync(tmpPath, output.endsWith("\n") ? output : `${output}\n`);
fs.renameSync(tmpPath, outPath);
console.log(`Wrote ${outPath}`);
