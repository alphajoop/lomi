/* @proprietary license */

/**
 * Verifies manual docs screenshots: 28 WebP files (12 screens × light/dark),
 * each exactly 1280×720. See SCREENSHOT-MANIFEST.md for capture instructions.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DOCS_SCREENSHOT_BASE,
  DOCS_SCREENSHOT_HEIGHT,
  DOCS_SCREENSHOT_WIDTH,
  expectedDocsScreenshotPaths,
} from '@/lib/scripts/docs-screenshots-manifest';

type ImageSize = { width: number; height: number };

function readWebpDimensions(buffer: Buffer): ImageSize | null {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourcc = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;

    if (fourcc === 'VP8 ' && payload + 10 <= buffer.length) {
      return {
        width: buffer.readUInt16LE(payload + 6) & 0x3fff,
        height: buffer.readUInt16LE(payload + 8) & 0x3fff,
      };
    }

    if (fourcc === 'VP8L' && payload + 5 <= buffer.length) {
      const bits = buffer.readUInt32LE(payload + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    if (fourcc === 'VP8X' && payload + 10 <= buffer.length) {
      return {
        width: 1 + buffer.readUIntLE(payload + 4, 3),
        height: 1 + buffer.readUIntLE(payload + 7, 3),
      };
    }

    offset = payload + size + (size % 2);
  }

  return null;
}

async function main(): Promise<void> {
  const imagesRoot = path.resolve(process.cwd(), DOCS_SCREENSHOT_BASE);
  const expected = expectedDocsScreenshotPaths();

  const missing: string[] = [];
  const wrongSize: string[] = [];
  const unreadable: string[] = [];

  for (const relativePath of expected) {
    const absolutePath = path.join(imagesRoot, relativePath);

    let buffer: Buffer;
    try {
      buffer = await readFile(absolutePath);
    } catch {
      missing.push(relativePath);
      continue;
    }

    const dimensions = readWebpDimensions(buffer);
    if (!dimensions) {
      unreadable.push(relativePath);
      continue;
    }

    if (
      dimensions.width !== DOCS_SCREENSHOT_WIDTH ||
      dimensions.height !== DOCS_SCREENSHOT_HEIGHT
    ) {
      wrongSize.push(
        `${relativePath} (${dimensions.width}×${dimensions.height}, expected ${DOCS_SCREENSHOT_WIDTH}×${DOCS_SCREENSHOT_HEIGHT})`,
      );
    }
  }

  const ok =
    missing.length === 0 && wrongSize.length === 0 && unreadable.length === 0;

  if (ok) {
    console.log(
      `[docs screenshots] OK — ${expected.length} files at ${DOCS_SCREENSHOT_WIDTH}×${DOCS_SCREENSHOT_HEIGHT}`,
    );
    return;
  }

  console.error('[docs screenshots] verification failed\n');

  if (missing.length > 0) {
    console.error(`Missing (${missing.length}/${expected.length}):`);
    for (const file of missing) console.error(`  - ${file}`);
  }

  if (unreadable.length > 0) {
    console.error(`Unreadable WebP (${unreadable.length}):`);
    for (const file of unreadable) console.error(`  - ${file}`);
  }

  if (wrongSize.length > 0) {
    console.error(`Wrong dimensions (${wrongSize.length}):`);
    for (const file of wrongSize) console.error(`  - ${file}`);
  }

  console.error(
    `\nDrop captures in ${DOCS_SCREENSHOT_BASE}/ — see SCREENSHOT-MANIFEST.md`,
  );
  process.exit(1);
}

void main();
