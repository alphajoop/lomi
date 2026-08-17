import {
  coerceCaughtError,
  isJsonObject,
  isString,
  type ErrorInput,
  type JsonObject,
  type JsonValue,
} from "./json-value.js";

function isErrorInputString(value: ErrorInput): value is string {
  return typeof value === "string";
}

export type SupabaseRpcResult<T> = {
  data: T | null;
  error: Error | string | JsonValue | null;
};

export type SupabaseRpcOptions<T> = {
  fallbackValue?: T | null;
  expectReturnValue?: boolean;
};

function isSupabaseRpcOptions<T>(
  value: T | SupabaseRpcOptions<T>,
): value is SupabaseRpcOptions<T> {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  return "expectReturnValue" in value || "fallbackValue" in value;
}

function extractRpcErrorMessage(error: Error | string | JsonValue): string {
  if (error instanceof Error) return error.message;
  if (isString(error)) return error;
  if (isJsonObject(error)) {
    const message = error["message"];
    if (isString(message)) return message;
    const details = error["details"];
    if (isString(details)) return details;
    const hint = error["hint"];
    if (isString(hint)) return hint;
  }
  return "An error occurred";
}

/**
 * Standard error handling for Supabase RPC calls.
 * Throws on error unless a non-null fallbackValue is provided.
 * Void RPCs (`expectReturnValue: false`) return true on success.
 */
export async function handleSupabaseRpc<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  options: SupabaseRpcOptions<T>,
): Promise<T | null | boolean>;

export async function handleSupabaseRpc<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  fallbackValue: T,
): Promise<T | null>;

export async function handleSupabaseRpc<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
): Promise<T | null>;

export async function handleSupabaseRpc<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  optionsOrFallback?: T | SupabaseRpcOptions<T>,
): Promise<T | null | boolean> {
  let options: SupabaseRpcOptions<T> = {};
  let isLegacyFallback = false;

  if (optionsOrFallback !== undefined && optionsOrFallback !== null) {
    if (isSupabaseRpcOptions(optionsOrFallback)) {
      options = optionsOrFallback;
    } else {
      options = { fallbackValue: optionsOrFallback };
      isLegacyFallback = true;
    }
  } else if (optionsOrFallback === null) {
    options = { fallbackValue: null };
    isLegacyFallback = true;
  }

  try {
    const { data, error } = await rpcCall;
    const { fallbackValue, expectReturnValue = true } = options;

    if (error) {
      // SAFETY: Supabase client error is Error | PostgREST JSON at the I/O boundary.
      const caught = error as Error | string | JsonValue;
      logError(operationName, coerceCaughtError(caught), {
        rpcCall: operationName,
      });

      const errorMessage = extractRpcErrorMessage(caught);

      if (fallbackValue !== undefined && fallbackValue !== null) {
        return fallbackValue;
      }

      throw new Error(errorMessage);
    }

    if (!expectReturnValue && !isLegacyFallback) {
      return true;
    }

    return data;
  } catch (error) {
    // SAFETY: catch is the language boundary for thrown values.
    const caught = error as Error | string | JsonValue;
    logError(operationName, coerceCaughtError(caught), {
      rpcCall: operationName,
    });

    const { fallbackValue } = options;

    if (fallbackValue !== undefined && fallbackValue !== null) {
      return fallbackValue;
    }

    throw error;
  }
}

/**
 * Hosted-checkout adapter: never throws.
 * Shared helper logs; this swallows and returns false / fallback / null.
 */
export async function handleSupabaseRpcSoft<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  options: SupabaseRpcOptions<T>,
): Promise<T | null | boolean>;

export async function handleSupabaseRpcSoft<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  fallbackValue: T,
): Promise<T | null>;

export async function handleSupabaseRpcSoft<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
): Promise<T | null>;

export async function handleSupabaseRpcSoft<T>(
  rpcCall: PromiseLike<SupabaseRpcResult<T>>,
  operationName: string,
  optionsOrFallback?: T | SupabaseRpcOptions<T>,
): Promise<T | null | boolean> {
  let options: SupabaseRpcOptions<T> = {};
  let isLegacyFallback = false;
  let legacyNullFallback = false;

  if (optionsOrFallback !== undefined && optionsOrFallback !== null) {
    if (isSupabaseRpcOptions(optionsOrFallback)) {
      options = optionsOrFallback;
    } else {
      options = { fallbackValue: optionsOrFallback };
      isLegacyFallback = true;
    }
  } else if (optionsOrFallback === null) {
    isLegacyFallback = true;
    legacyNullFallback = true;
  }

  const { fallbackValue, expectReturnValue = true } = options;

  try {
    if (optionsOrFallback === undefined) {
      return await handleSupabaseRpc(rpcCall, operationName);
    }
    return await handleSupabaseRpc(rpcCall, operationName, options);
  } catch {
    if (!expectReturnValue && !isLegacyFallback) {
      return false;
    }
    if (legacyNullFallback) return null;
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return null;
  }
}

export async function handleRpcOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T,
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    // SAFETY: catch is the language boundary for thrown values.
    const caught = error as Error | string | JsonValue;
    console.error(`Error in ${operationName}:`, coerceCaughtError(caught));

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw error;
  }
}

export function getErrorMessage(error: ErrorInput): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isErrorInputString(error)) {
    return error;
  }

  const message = error.message;
  if (message !== undefined && message.trim()) {
    return message;
  }
  const nestedError = error.error;
  if (nestedError !== undefined && nestedError.trim()) {
    return nestedError;
  }

  return "An unexpected error occurred";
}

export function messageFromCatch(error: Error | string | JsonValue): string {
  return getErrorMessage(coerceCaughtError(error));
}

export function logError(
  context: string,
  error: ErrorInput,
  additionalData?: JsonObject,
): void {
  console.error(`[${context}] Error:`, {
    error: getErrorMessage(error),
    additionalData,
    timestamp: new Date().toISOString(),
  });
}
