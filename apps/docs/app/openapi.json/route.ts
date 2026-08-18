import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const revalidate = 3600;

export async function GET() {
  const filePath = path.join(process.cwd(), 'openapi.json');
  const body = await readFile(filePath, 'utf-8');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
