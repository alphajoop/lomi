/* @proprietary license */

/** English copy for OpenAPI fields that ship French-only from the API spec. */

const FRENCH_MARKERS =
  /[àâäæçéèêëïîôùûüœ]|(?:\b(les|des|pour|avec|une|indiquez|clé|succès|manquante|créé|retourne|liste|supprime|met à jour)\b)/i;

export function isLikelyFrench(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return FRENCH_MARKERS.test(trimmed);
}

const EN_STANDARD_HTTP_RESPONSES: Record<string, string> = {
  '200': 'Success',
  '201': 'Created successfully',
  '202': 'Accepted',
  '204': 'No content',
  '400': 'Bad request, invalid or missing parameters',
  '401': 'Invalid or missing API key',
  '403': 'Forbidden, insufficient permissions',
  '404': 'Resource not found',
  '409': 'Conflict, resource state prevents this action',
  '422': 'Unprocessable entity, validation failed',
  '429': 'Too many requests',
  '500': 'Internal server error',
  '502': 'Bad gateway',
  '503': 'Service unavailable',
};

export function englishResponseDescription(
  statusCode: string,
  openApiDescription: string | undefined,
): string {
  const desc = openApiDescription?.trim() ?? '';
  if (!desc || isLikelyFrench(desc)) {
    return EN_STANDARD_HTTP_RESPONSES[statusCode] ?? (desc || ', ');
  }
  return desc;
}

export function englishRequestBodyIntro(
  openApiDescription: string | undefined,
  override: string | undefined,
  jsonPayloadFallback: string,
): string {
  if (override?.trim()) return override.trim();
  const desc = openApiDescription?.trim() ?? '';
  if (!desc || isLikelyFrench(desc)) return jsonPayloadFallback;
  return desc;
}
