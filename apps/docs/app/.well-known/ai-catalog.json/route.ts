/* @proprietary license */

import {
  buildDocsAiCatalog,
  discoveryJsonResponse,
} from '@/lib/seo/agent-discovery';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export const revalidate = false;

export function GET() {
  return discoveryJsonResponse(buildDocsAiCatalog(getDocsSiteOrigin()));
}
