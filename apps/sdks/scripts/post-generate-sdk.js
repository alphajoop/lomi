#!/usr/bin/env node
/**
 * Post-generation script to automatically create SDK wrapper
 */

import { writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servicesDir = join(__dirname, '../ts/src/generated/services');
const sdkPath = join(__dirname, '../ts/src/sdk.ts');

console.log('🔧 Generating SDK wrapper from services...');

if (!existsSync(servicesDir)) {
  console.error('❌ Services directory not found:', servicesDir);
  process.exit(1);
}

const serviceFiles = readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));
const services = serviceFiles.map((f) => f.replace('.ts', ''));

function getPropertyName(serviceName) {
  const withoutService = serviceName.replace(/Service$/, '');
  return withoutService.charAt(0).toLowerCase() + withoutService.slice(1);
}

const sdkContent = `/**
 * Main lomi. SDK class
 * AUTO-GENERATED - Do not edit manually
 */

import type { LomiConfig } from './config.js';
import { LomiClient } from './client.js';
import {
${services.map((s) => `  ${s},`).join('\n')}
} from './generated/index.js';

export class LomiSDK {
  private readonly client: LomiClient;

${services.map((s) => {
  const propName = getPropertyName(s);
  return `  public readonly ${propName}: ${s};`;
}).join('\n')}

  constructor(config: LomiConfig) {
    this.client = new LomiClient(config);

${services.map((s) => {
  const propName = getPropertyName(s);
  return `    this.${propName} = new ${s}(this.client);`;
}).join('\n')}
  }

  /** Rotate the secret API key on this client instance. */
  setApiKey(apiKey: string): void {
    this.client.setApiKey(apiKey);
  }

  /** Current API base URL for this client instance. */
  getBaseUrl(): string {
    return this.client.baseUrl;
  }
}
`;

writeFileSync(sdkPath, sdkContent, 'utf-8');
console.log('✅ SDK wrapper generated successfully!');
console.log(`   Available services: ${services.map((s) => getPropertyName(s)).join(', ')}`);
