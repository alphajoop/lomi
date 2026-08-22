/* @proprietary license */

import {
  isJsonArray,
  isJsonObject,
  isString,
  type JsonObject,
  type JsonValue,
} from '@lomi./shared';
import { isOriginAllowedForProxy } from '@/lib/openapi-secure-proxy';

const SANDBOX_SERVER: JsonObject = {
  url: 'https://sandbox.api.lomi.africa',
  description: 'Test',
};

/** Keep only sandbox servers so Try-it cannot target live by default. */
export function sandboxOnlyOpenApiDocument(document: JsonValue): JsonObject {
  if (!isJsonObject(document)) {
    throw new Error('OpenAPI document must be a JSON object');
  }

  const serversValue = document.servers;
  const sandboxServers: JsonValue[] = [];
  if (isJsonArray(serversValue)) {
    for (const server of serversValue) {
      if (!isJsonObject(server) || !isString(server.url)) continue;
      if (isOriginAllowedForProxy(server.url)) {
        sandboxServers.push(server);
      }
    }
  }

  const nextDocument: JsonObject = {};
  for (const [key, value] of Object.entries(document)) {
    nextDocument[key] = value;
  }
  nextDocument.servers =
    sandboxServers.length > 0 ? sandboxServers : [SANDBOX_SERVER];
  return nextDocument;
}
