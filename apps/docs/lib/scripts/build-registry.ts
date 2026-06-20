/* @proprietary license */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { registry } from '@/components/preview/registry';
import { lomiUiRegistry } from '@/components/lomi-ui/registry';

function resolveSourceFile(baseDir: string, rel: string): string {
  return path.normalize(path.join(baseDir, rel));
}

export async function buildRegistry(): Promise<void> {
  const outDir = path.join(process.cwd(), 'public/registry');
  await mkdir(outDir, { recursive: true });

  const indexes: { name: string; title?: string; description?: string }[] = [];

  for (const comp of registry.components) {
    indexes.push({
      name: comp.name,
      ...(comp.title ? { title: comp.title } : {}),
      ...(comp.description ? { description: comp.description } : {}),
    });

    const files = [];
    for (const f of comp.files) {
      const abs = resolveSourceFile(registry.dir, f.path);
      const content = await readFile(abs);
      files.push({
        content: content.toString('utf8'),
        type: f.type,
        path: f.path,
      });
    }

    const payload = {
      name: comp.name,
      ...(comp.title ? { title: comp.title } : {}),
      ...(comp.description ? { description: comp.description } : {}),
      files,
      subComponents: [] as unknown[],
      dependencies: registry.dependencies,
      devDependencies: {},
    };

    const jsonRel = `${comp.name}.json`;
    const jsonPath = path.join(outDir, jsonRel);
    await mkdir(path.dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  }

  await writeFile(
    path.join(outDir, '_registry.json'),
    `${JSON.stringify({ indexes }, null, 2)}\n`,
  );

  await buildLomiUiRegistry();
}

async function buildLomiUiRegistry(): Promise<void> {
  const outDir = path.join(process.cwd(), 'public/r');
  await mkdir(outDir, { recursive: true });

  const items = [];

  for (const item of lomiUiRegistry.items) {
    const files = [];
    for (const file of item.files) {
      const abs = path.join(lomiUiRegistry.dir, file.path);
      const content = await readFile(abs, 'utf8');
      files.push({
        path: file.path,
        target: file.target,
        type: file.type,
        content,
      });
    }

    const assetFiles = [];
    for (const asset of item.assetFiles ?? []) {
      const abs = path.join(lomiUiRegistry.dir, asset.path);
      const content = await readFile(abs);
      assetFiles.push({
        path: asset.path,
        target: asset.target,
        type: asset.type,
        encoding: 'base64',
        content: content.toString('base64'),
      });
    }

    const payload = {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: item.name,
      type: 'registry:block',
      title: item.title,
      description: item.description,
      ...(item.dependencies ? { dependencies: item.dependencies } : {}),
      ...(item.registryDependencies
        ? { registryDependencies: item.registryDependencies }
        : {}),
      files,
      ...(assetFiles.length > 0 ? { assetFiles } : {}),
    };

    items.push({
      name: item.name,
      type: 'registry:block',
      title: item.title,
      description: item.description,
      ...(item.dependencies ? { dependencies: item.dependencies } : {}),
    });

    await writeFile(
      path.join(outDir, `${item.name}.json`),
      `${JSON.stringify(payload, null, 2)}\n`,
    );
  }

  await writeFile(
    path.join(outDir, 'all.json'),
    `${JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: 'all',
        type: 'registry:block',
        title: 'lomi. UI Checkout Kit',
        description: 'All lomi. UI checkout components.',
        registryDependencies: lomiUiRegistry.items.map(
          (item) => `/r/${item.name}.json`,
        ),
        files: [],
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    path.join(outDir, 'registry.json'),
    `${JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: lomiUiRegistry.name,
        version: lomiUiRegistry.version,
        homepage: lomiUiRegistry.homepage,
        items,
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    path.join(outDir, 'index.json'),
    `${JSON.stringify(
      {
        name: lomiUiRegistry.name,
        version: lomiUiRegistry.version,
        homepage: lomiUiRegistry.homepage,
        registry_url: 'https://docs.lomi.africa/r/registry.json',
        items: items.map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          ...(item.dependencies ? { dependencies: item.dependencies } : {}),
        })),
      },
      null,
      2,
    )}\n`,
  );
}
