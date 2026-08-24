/* @proprietary license */

import {
  buildDocsAgentCard,
  discoveryJsonResponse,
} from '@/lib/seo/agent-discovery';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export const revalidate = false;

export function GET() {
  return discoveryJsonResponse(buildDocsAgentCard(getDocsSiteOrigin()));
}
