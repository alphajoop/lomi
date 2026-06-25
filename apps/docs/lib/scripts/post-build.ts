/* @proprietary license */

import env from '@next/env';
import { generateSitemap } from './generate_sitemap';
import { updateSearchIndexes } from './update-orama-index';

env.loadEnvConfig(process.cwd());

async function main() {
  try {
    await Promise.all([updateSearchIndexes(), generateSitemap()]);
  } catch (error) {
    console.warn(
      'Search index sync failed, but build continues:',
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - allow build to succeed even if search sync fails
  }
}

await main();
