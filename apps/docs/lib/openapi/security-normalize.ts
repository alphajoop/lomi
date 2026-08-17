/* @proprietary license */

import type {
  Document,
  OperationObject,
  PathItemObject,
} from '@/lib/openapi/types';
import { type JsonObject } from '@lomi./shared';

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
  // SAFETY: Boundary value matches the asserted domain type at this call site.
  const schemes = document.components?.securitySchemes as
    JsonObject | undefined;

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
      // SAFETY: Boundary value matches the asserted domain type at this call site.
      document.security as SecurityRequirementObject[],
    );
  }

  if (!document.paths) return document;

  for (const pathItem of Object.values(document.paths)) {
    if (!pathItem) continue;

    // SAFETY: Boundary value matches the asserted domain type at this call site.
    const item = pathItem as PathItemObject & {
      security?: SecurityRequirementObject[];
    };
    if (item.security) {
      item.security = mapSecurityRequirements(
        // SAFETY: Boundary value matches the asserted domain type at this call site.
        item.security as SecurityRequirementObject[],
      );
    }

    for (const method of HTTP_METHODS) {
      // SAFETY: Boundary value matches the asserted domain type at this call site.
      const operation = item[method] as OperationObject | undefined;
      if (!operation?.security) continue;
      operation.security = mapSecurityRequirements(
        // SAFETY: Boundary value matches the asserted domain type at this call site.
        operation.security as SecurityRequirementObject[],
      );
    }
  }

  return document;
}
