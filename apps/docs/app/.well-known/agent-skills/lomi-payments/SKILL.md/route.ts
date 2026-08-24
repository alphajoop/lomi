/* @proprietary license */

import {
  buildAgentSkillMarkdown,
  discoveryMarkdownResponse,
} from '@/lib/seo/agent-discovery';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export const revalidate = false;

export function GET() {
  return discoveryMarkdownResponse(
    buildAgentSkillMarkdown(getDocsSiteOrigin()),
  );
}
