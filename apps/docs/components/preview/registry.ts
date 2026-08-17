/* @proprietary license */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JsonValue } from '@lomi./shared';

export interface RegistryFile {
  type: string;
  path: string;
}

export interface RegistryComponent {
  name: string;
  title?: string;
  description?: string;
  files: RegistryFile[];
}

export interface Registry {
  dir: string;
  name: string;
  packageJson: string;
  tsconfigPath: string;
  onUnknownFile(absolutePath: string):
    | undefined
    | {
        type: string;
        path: string;
      };
  onResolve(ref: JsonValue): JsonValue;
  components: RegistryComponent[];
  dependencies: Record<string, string | null>;
}

const baseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const registry: Registry = {
  dir: baseDir,
  name: 'lomi. / docs',
  packageJson: '../package.json',
  tsconfigPath: '../tsconfig.json',
  onUnknownFile(absolutePath) {
    const filePath = path.relative(baseDir, absolutePath);

    if (filePath === 'lib/source.ts') return undefined;
    if (absolutePath.includes('node_modules')) return undefined;
    if (absolutePath.endsWith('.d.ts')) return undefined;

    if (filePath === 'lib/cn.ts') {
      return {
        type: 'lib',
        path: 'lib/cn.ts',
      };
    }

    if (filePath.startsWith('lib/')) return undefined;

    return undefined;
  },
  onResolve(ref) {
    return ref;
  },
  components: [
    {
      name: 'graph-view',
      description: 'A graph to display relationships of all pages',
      files: [
        {
          type: 'components',
          path: 'preview/graph-view.tsx',
        },
      ],
    },
    {
      name: 'mdx/page-actions',
      title: 'AI Page Actions',
      description: 'Common page actions for AI',
      files: [
        {
          type: 'components',
          path: 'preview/page-actions.tsx',
        },
      ],
    },
    {
      name: 'og/mono',
      description: 'Open graph image generation',
      files: [
        {
          type: 'lib',
          path: '../lib/og/mono.tsx',
        },
        {
          type: 'lib',
          path: '../lib/og/Inter-SemiBold.ttf',
        },
        {
          type: 'lib',
          path: '../lib/og/Inter-Regular.ttf',
        },
      ],
    },
  ],
  dependencies: {
    'fumadocs-core': null,
    'fumadocs-ui': null,
    next: null,
    react: null,
  },
};
