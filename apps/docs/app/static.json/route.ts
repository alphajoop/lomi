/* @proprietary license */

import { buildDocsSearchDocuments } from '@/lib/search/documents';

export const revalidate = false;

export async function GET(): Promise<Response> {
  return Response.json(buildDocsSearchDocuments());
}
