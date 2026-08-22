/* @proprietary license */

export const OPENAPI_HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

export type OpenApiHttpMethod = (typeof OPENAPI_HTTP_METHODS)[number];

export function toOpenApiHttpMethod(method: string): OpenApiHttpMethod | null {
  switch (method.toLowerCase()) {
    case 'get':
      return 'get';
    case 'put':
      return 'put';
    case 'post':
      return 'post';
    case 'delete':
      return 'delete';
    case 'options':
      return 'options';
    case 'head':
      return 'head';
    case 'patch':
      return 'patch';
    case 'trace':
      return 'trace';
    default:
      return null;
  }
}
