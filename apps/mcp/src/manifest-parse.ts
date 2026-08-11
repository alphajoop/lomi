import type { ToolsManifest } from './manifest.js';

export function parseManifest(data: unknown): ToolsManifest {
  if (
    !data ||
    typeof data !== 'object' ||
    (data as ToolsManifest).manifestVersion !== 1 ||
    !Array.isArray((data as ToolsManifest).tools)
  ) {
    throw new Error('Invalid tools-manifest.json');
  }
  return data as ToolsManifest;
}
