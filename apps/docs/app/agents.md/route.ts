/* @proprietary license */

import {
  buildDocsAgentsMarkdown,
  discoveryMarkdownResponse,
} from '@/lib/seo/agent-discovery';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export const revalidate = false;

export function GET() {
  return discoveryMarkdownResponse(
    buildDocsAgentsMarkdown(getDocsSiteOrigin()),
  );
}
