/* @proprietary license */

import type {
  Document,
  OperationObject,
  PathItemObject,
} from '@/lib/openapi/types';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

/** OpenAPI security requirement object: scheme name -> scopes (usually empty for apiKey). */
type SecurityRequirementObject = Record<string, string[]>;

function mapSecurityRequirements(
  requirements: SecurityRequirementObject[] | undefined,
): SecurityRequirementObject[] | undefined {
  if (!requirements) return requirements;

  return requirements.map((req) => {
    if (req['X-API-KEY'] && !req['api-key']) {
      return { 'api-key': req['X-API-KEY'] };
    }
    if (req['X-API-KEY'] && req['api-key']) {
      return { 'api-key': req['api-key'] };
    }
    return req;
  });
}

/**
 * Collapse legacy `X-API-KEY` scheme name to `api-key` and strip duplicate scheme
 * definitions so Fumadocs renders a single Authorization block.
 */
export function normalizeOpenApiSecurity(document: Document): Document {
  const schemes = document.components?.securitySchemes as
    | Record<string, unknown>
    | undefined;

  if (schemes) {
    if (schemes['X-API-KEY'] && !schemes['api-key']) {
      schemes['api-key'] = schemes['X-API-KEY'];
    }
    if (schemes['X-API-KEY'] && schemes['api-key']) {
      delete schemes['X-API-KEY'];
    }
  }

  if (document.security) {
    document.security = mapSecurityRequirements(
      document.security as SecurityRequirementObject[],
    );
  }

  if (!document.paths) return document;

  for (const pathItem of Object.values(document.paths)) {
    if (!pathItem) continue;

    const item = pathItem as PathItemObject & {
      security?: SecurityRequirementObject[];
    };
    if (item.security) {
      item.security = mapSecurityRequirements(
        item.security as SecurityRequirementObject[],
      );
    }

    for (const method of HTTP_METHODS) {
      const operation = item[method] as OperationObject | undefined;
      if (!operation?.security) continue;
      operation.security = mapSecurityRequirements(
        operation.security as SecurityRequirementObject[],
      );
    }
  }

  return document;
}
