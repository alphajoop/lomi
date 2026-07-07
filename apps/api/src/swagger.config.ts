/* @proprietary license */

import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Shared OpenAPI / Swagger document config for runtime (`main.ts`) and
 * static export (`scripts/export-openapi.ts`).
 */
export function buildSwaggerDocumentBase() {
  return new DocumentBuilder()
    .setTitle('API lomi.')
    .setDescription(
      "API de traitement des paiements pour les entreprises d'Afrique de l'Ouest francophone.",
    )
    .setVersion('1.1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-KEY', in: 'header' }, 'api-key')
    .addApiKey(
      { type: 'apiKey', name: 'X-Lomi-Provisioning-Key', in: 'header' },
      'provisioning-key',
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-Lomi-Partner-Key', in: 'header' },
      'partner-key',
    )
    .build();
}
