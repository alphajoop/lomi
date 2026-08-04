/* @proprietary license */

import { buildAgentCorpusIndex } from '@/lib/docs/agent-corpus/build';

export const revalidate = false;

const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=86400',
} as const;

export function GET() {
  return new Response(buildAgentCorpusIndex(), { headers: HEADERS });
}
