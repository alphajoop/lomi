#!/usr/bin/env node
/**
 * Smoke test: every *.json under bubble/ must parse (Bubble plugin editor sync).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(__dirname, "..");
const bubbleDir = path.join(pluginsDir, "bubble");

function walkJsonFiles(dir, out = []) {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkJsonFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(full);
    }
  }
  return out;
}

const jsonFiles = walkJsonFiles(bubbleDir);
if (jsonFiles.length === 0) {
  console.log("SKIP: bubble submodule not checked out or has no JSON files");
  process.exit(0);
}

let failed = 0;
for (const file of jsonFiles) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`FAIL: ${path.relative(pluginsDir, file)} — ${err.message}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`PASS: ${jsonFiles.length} Bubble JSON file(s) parse cleanly`);
