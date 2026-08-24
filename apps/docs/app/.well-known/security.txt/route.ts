/* @proprietary license */

import { NextResponse } from 'next/server';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export const revalidate = false;

export function GET() {
  const origin = getDocsSiteOrigin();
  const body = `Contact: mailto:security@lomi.africa
Contact: https://github.com/lomiafrica/lomi./security/advisories/new
Expires: 2027-08-24T00:00:00.000Z
Preferred-Languages: en, fr
Canonical: ${origin}/.well-known/security.txt
Policy: ${origin}/build/reliability/security-best-practices
Acknowledgments: ${origin}/build/reliability/security-best-practices

# lomi. Technologies Africa S.A welcomes responsible disclosure.
# Do not test against other users' data. Prefer sandbox and test accounts.
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
