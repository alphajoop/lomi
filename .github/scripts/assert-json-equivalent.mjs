#!/usr/bin/env node
/**
 * Semantic JSON compare (ignores formatting).
 * Usage:
 *   node .github/scripts/assert-json-equivalent.mjs <path> [path...]
 *     Compare each working-tree file to HEAD.
 *   node .github/scripts/assert-json-equivalent.mjs --same a.json b.json [c.json d.json ...]
 *     Compare file pairs to each other.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function loadJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    'usage: node .github/scripts/assert-json-equivalent.mjs <path>... | --same a.json b.json ...',
  );
  process.exit(2);
}

let failed = 0;

if (args[0] === '--same') {
  const files = args.slice(1);
  if (files.length < 2 || files.length % 2 !== 0) {
    console.error('usage: --same requires path pairs');
    process.exit(2);
  }
  for (let i = 0; i < files.length; i += 2) {
    const left = files[i];
    const right = files[i + 1];
    if (!sameJson(loadJson(left), loadJson(right))) {
      console.error(`JSON drift: ${left} vs ${right}`);
      failed = 1;
    } else {
      console.log(`ok ${left} == ${right}`);
    }
  }
  process.exit(failed);
}

for (const file of args) {
  const committed = JSON.parse(
    execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' }),
  );
  if (!sameJson(committed, loadJson(file))) {
    console.error(`JSON drift: ${file} (semantic content differs from HEAD)`);
    failed = 1;
  } else {
    console.log(`ok ${file}`);
  }
}

process.exit(failed);
