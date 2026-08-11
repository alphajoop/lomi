/** Minimal OpenAPI parameter typing for codegen */

export type ParameterObject = {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
};
