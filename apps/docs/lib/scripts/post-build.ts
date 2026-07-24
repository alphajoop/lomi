/* @proprietary license */

import { loadEnvConfig } from '@next/env';
import { updateSearchIndexes } from './update-orama-index';

loadEnvConfig(process.cwd());

async function main() {
  try {
    await updateSearchIndexes();
  } catch (error) {
    console.warn(
      'Search index sync failed, but build continues:',
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - allow build to succeed even if search sync fails
  }
}

void main();
