/**
 * Shared helpers for OpenAPI → MCP manifest generation (used by scripts/generate-tools.ts).
 */
import type { ParameterObject } from './openapi-types.js';
import { resolveEnglishSchemaDescription } from './mcp-english-copy.js';

export type OpenAPISpec = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
};

export type ResolvedJsonSchema = Record<string, unknown>;

/** `{id}` segments in an OpenAPI path template (order preserved). */
export function pathTemplateParamNames(template: string): string[] {
  const names: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    const n = m[1]?.trim();
    if (n) names.push(n);
  }
  return names;
}

function sortKeysStable<T extends Record<string, unknown>>(obj: T): T {
  const sorted = {} as Record<string, unknown>;
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = obj[k];
  }
  return sorted as T;
}

/**
 * Deterministic JSON Schema for MCP: sorted `required`, sorted `properties` keys,
 * shallow recurse into `properties` values if they are objects with `properties`.
 */
export function canonicalizeInputSchema(schema: ResolvedJsonSchema): ResolvedJsonSchema {
  const out = { ...schema } as ResolvedJsonSchema;
  if (Array.isArray(out.required)) {
    out.required = [...(out.required as string[])].sort();
  }
  if (
    out.properties &&
    typeof out.properties === 'object' &&
    !Array.isArray(out.properties)
  ) {
    const props = out.properties as Record<string, unknown>;
    const nextProps: Record<string, unknown> = {};
    for (const key of Object.keys(props).sort()) {
      const v = props[key];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const child = v as ResolvedJsonSchema;
        if (child.properties && typeof child.properties === 'object') {
          nextProps[key] = canonicalizeInputSchema(child as ResolvedJsonSchema);
          continue;
        }
      }
      nextProps[key] = v as unknown;
    }
    out.properties = sortKeysStable(nextProps as Record<string, unknown>);
  }
  return out;
}

/** Ensure every `{pathParam}` appears in schema.properties and required[]. */
export function ensurePathParamsInInputSchema(
  schema: ResolvedJsonSchema,
  pathTemplate: string,
): ResolvedJsonSchema {
  const pathNames = pathTemplateParamNames(pathTemplate);
  if (pathNames.length === 0) return canonicalizeInputSchema(schema);

  const props =
    typeof schema.properties === 'object' &&
    schema.properties !== null &&
    !Array.isArray(schema.properties)
      ? ({
          ...(schema.properties as Record<string, ResolvedJsonSchema>),
        } as Record<string, ResolvedJsonSchema>)
      : ({} as Record<string, ResolvedJsonSchema>);

  const req = new Set<string>(
    Array.isArray(schema.required) ? (schema.required as string[]) : [],
  );

  for (const name of pathNames) {
    if (!props[name]) {
      props[name] = {
        type: 'string',
        description: `Path parameter "${name}" for \`${pathTemplate}\`.`,
      };
    }
    req.add(name);
  }

  const merged: ResolvedJsonSchema = {
    ...schema,
    type: 'object',
    properties: props as ResolvedJsonSchema['properties'],
    required: [...req].sort(),
  };

  return canonicalizeInputSchema(merged);
}

export function toolNameFromOperation(
  methodLower: string,
  pathTemplate: string,
): string {
  const slug = pathTemplate
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/{([^}]+)}/g, '$1')
    .replace(/-/g, '_');
  return `lomi_${methodLower}_${slug}`;
}

export function resolveRef(
  ref: string | undefined,
  spec: OpenAPISpec,
): ResolvedJsonSchema | null {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  let cur: unknown = spec;
  for (const segment of ref.replace(/^#\//, '').split('/')) {
    if (cur === null || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[segment];
  }
  return cur !== null && typeof cur === 'object'
    ? (cur as ResolvedJsonSchema)
    : null;
}

function normalizeParam(
  p: ParameterObject | { $ref?: string } | undefined,
  resolve: (ref: string) => ResolvedJsonSchema | null,
): ParameterObject | null {
  if (!p || typeof p !== 'object') return null;
  if ('$ref' in p && typeof p.$ref === 'string') {
    const r = resolve(p.$ref);
    return r as ParameterObject | null;
  }
  return p as ParameterObject;
}

export function flattenOperationParameters(
  spec: OpenAPISpec,
  pathItem: Record<string, unknown>,
  operation: Record<string, unknown>,
): ParameterObject[] {
  const resolve = (ref: string) => resolveRef(ref, spec);
  const merged = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ];
  const out: ParameterObject[] = [];
  const seen = new Set<string>();
  for (const raw of merged) {
    const n = normalizeParam(raw as ParameterObject, resolve);
    if (
      n &&
      n.in &&
      n.name &&
      (n.in === 'query' || n.in === 'path' || n.in === 'header')
    ) {
      const k = `${n.in}:${n.name}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

function cloneSchema(node: unknown): unknown {
  return node === undefined ? undefined : JSON.parse(JSON.stringify(node));
}

/** Inline $ref for JSON Schema objects (shallow recursion with cycle guard). */
export function inlineRefs(
  node: unknown,
  spec: OpenAPISpec,
  seenRefs = new Set<string>(),
  depth = 0,
): unknown {
  if (depth > 24) return node;
  if (node === null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return node.map((x) => inlineRefs(x, spec, seenRefs, depth + 1));
  }

  const obj = node as Record<string, unknown>;
  if (typeof obj.$ref === 'string') {
    const ref = obj.$ref;
    if (seenRefs.has(ref)) return { type: 'object', additionalProperties: true };
    seenRefs.add(ref);
    const resolved = resolveRef(ref, spec);
    if (!resolved) return { type: 'object', additionalProperties: true };
    return inlineRefs(cloneSchema(resolved), spec, seenRefs, depth + 1);
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = inlineRefs(v, spec, seenRefs, depth + 1);
  }
  return out;
}

function jsonSchemaFromParameter(
  param: ParameterObject,
  fieldName?: string,
): ResolvedJsonSchema {
  const schema =
    param.schema && typeof param.schema === 'object'
      ? (param.schema as ResolvedJsonSchema)
      : { type: 'string' };
  const base: ResolvedJsonSchema = {
    ...cloneSchema(schema) as ResolvedJsonSchema,
  };
  const name =
    fieldName ??
    (typeof param.name === 'string' ? param.name : 'parameter');
  base.description = resolveEnglishSchemaDescription(
    name,
    typeof param.description === 'string' ? param.description : undefined,
  );
  if (param.required === true && base.default === undefined) {
    // OpenAPI required flag on parameter
    return base;
  }
  return base;
}

function mergeBodySchema(
  bodySchema: unknown | undefined,
): ResolvedJsonSchema | undefined {
  if (!bodySchema || typeof bodySchema !== 'object') return undefined;
  const s = bodySchema as ResolvedJsonSchema;
  const out: ResolvedJsonSchema = {
    type: 'object',
    properties: {
      body: {
        ...s,
        description:
          typeof s.description === 'string'
            ? s.description
            : 'JSON request body for this operation.',
      },
    },
    required: ['body'],
  };
  return out;
}

function mergeSchemas(
  a: ResolvedJsonSchema | undefined,
  b: ResolvedJsonSchema | undefined,
): ResolvedJsonSchema {
  const A = a ?? { type: 'object', properties: {} };
  const B = b ?? { type: 'object', properties: {} };
  const props = {
    ...(typeof A.properties === 'object' && A.properties !== null
      ? (A.properties as Record<string, unknown>)
      : {}),
    ...(typeof B.properties === 'object' && B.properties !== null
      ? (B.properties as Record<string, unknown>)
      : {}),
  };
  const req = new Set<string>([
    ...(Array.isArray(A.required) ? (A.required as string[]) : []),
    ...(Array.isArray(B.required) ? (B.required as string[]) : []),
  ]);
  const schema: ResolvedJsonSchema = {
    type: 'object',
    properties: props as ResolvedJsonSchema['properties'],
  };
  if (req.size > 0) schema.required = [...req].sort();
  if (
    A.additionalProperties === true ||
    B.additionalProperties === true
  ) {
    schema.additionalProperties = true;
  }
  return schema;
}

export function buildInputJsonSchema(args: {
  spec: OpenAPISpec;
  operation: Record<string, unknown>;
  pathItem: Record<string, unknown>;
  pathTemplate: string;
  httpMethodLower: string;
  includeIdempotencyKey: boolean;
}): ResolvedJsonSchema {
  const {
    spec,
    operation,
    pathItem,
    pathTemplate,
    httpMethodLower,
    includeIdempotencyKey,
  } = args;

  const params = flattenOperationParameters(spec, pathItem, operation);
  const propBag: Record<string, ResolvedJsonSchema> = {};
  const required = new Set<string>();

  for (const p of params) {
    const loc = p.in;
    const key =
      loc === 'header'
        ? `header_${p.name}`
        : loc === 'query'
          ? p.name
          : p.name;

    propBag[key] = jsonSchemaFromParameter(p, key);
    if (p.required === true) required.add(key);
  }

  let merged: ResolvedJsonSchema = mergeSchemas(
    { type: 'object', properties: propBag },
    { type: 'object', required: [...required].sort() },
  );

  const wantsBody =
    ['post', 'patch', 'put'].includes(httpMethodLower) &&
    operation.requestBody &&
    typeof operation.requestBody === 'object';

  if (wantsBody) {
    const rb = operation.requestBody as Record<string, unknown>;
    const content = rb.content as Record<string, Record<string, unknown>>;
    const json = content?.['application/json'];
    const rawSchema = json?.schema;
    if (rawSchema && typeof rawSchema === 'object') {
      const inlined = inlineRefs(
        cloneSchema(rawSchema),
        spec,
      ) as ResolvedJsonSchema;
      const bodyWrapper = mergeBodySchema(inlined);
      if (bodyWrapper) merged = mergeSchemas(merged, bodyWrapper);
    }
  }

  if (includeIdempotencyKey) {
    const props =
      typeof merged.properties === 'object' && merged.properties !== null
        ? ({ ...(merged.properties as Record<string, unknown>) } as Record<
            string,
            ResolvedJsonSchema
          >)
        : {};
    props.idempotency_key = {
      type: 'string',
      description:
        'Optional Idempotency-Key header (recommended on writes for safe retries).',
    };
    merged = {
      ...merged,
      type: 'object',
      properties: props,
    };
    const reqArr = Array.isArray(merged.required)
      ? [...(merged.required as string[])]
      : [];
    merged.required = reqArr.sort();
  }

  return ensurePathParamsInInputSchema(merged, pathTemplate);
}
