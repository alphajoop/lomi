/* @proprietary license */

/** OpenAPI 3 types for docs preprocessing (no longer exported by fumadocs-openapi v10+). */

export type ReferenceObject = {
  $ref: string;
};

export type ParameterObject = {
  in: string;
  name: string;
  required?: boolean;
  schema?: { type?: string; [key: string]: unknown };
  description?: string;
};

export type OperationObject = {
  parameters?: Array<ParameterObject | ReferenceObject>;
  security?: Array<Record<string, string[]>>;
};

export type PathItemObject = {
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  security?: Array<Record<string, string[]>>;
};

export type Document = {
  paths?: Record<string, PathItemObject | undefined>;
  components?: {
    securitySchemes?: Record<string, unknown>;
  };
  security?: Array<Record<string, string[]>>;
};
