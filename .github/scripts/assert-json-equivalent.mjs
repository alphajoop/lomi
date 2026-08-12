#!/usr/bin/env node
/**
 * Compare working-tree JSON to HEAD semantically (ignores formatting).
 * Usage: node .github/scripts/assert-json-equivalent.mjs <path> [path...]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node .github/scripts/assert-json-equivalent.mjs <path>...');
  process.exit(2);
}

let failed = 0;
for (const file of files) {
  const committed = JSON.parse(
    execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' }),
  );
  const working = JSON.parse(readFileSync(file, 'utf8'));
  if (JSON.stringify(committed) !== JSON.stringify(working)) {
    console.error(`JSON drift: ${file} (semantic content differs from HEAD)`);
    failed = 1;
  } else {
    console.log(`ok ${file}`);
  }
}

process.exit(failed);
