/* @proprietary license */

import { NextResponse } from 'next/server';
import {
  DISCOVERY_MARKDOWN_HEADERS,
  buildDocsNotFoundMarkdown,
} from '@/lib/seo/agent-discovery';

export const revalidate = 0;

export function GET() {
  return new NextResponse(buildDocsNotFoundMarkdown(), {
    status: 404,
    headers: {
      ...DISCOVERY_MARKDOWN_HEADERS,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
