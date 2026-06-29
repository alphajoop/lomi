export type GimChargeScenarioKey =
  | 'approved'
  | 'declined'
  | '3ds'
  | 'retry_other_rail';

/** Normalize X-Scenario-Key for sandbox GIM charge simulations. */
export function normalizeGimScenarioKey(
  header: string | string[] | undefined,
): GimChargeScenarioKey | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  const key = raw?.trim().toLowerCase();
  if (
    key === 'approved' ||
    key === 'declined' ||
    key === '3ds' ||
    key === 'retry_other_rail'
  ) {
    return key;
  }
  return undefined;
}
