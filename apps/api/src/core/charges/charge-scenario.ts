export type ChargeScenarioKey = 'pending' | 'failed';

/** Normalize X-Scenario-Key for sandbox charge simulations. */
export function normalizeScenarioKey(
  header: string | string[] | undefined,
): ChargeScenarioKey | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  const key = raw?.trim().toLowerCase();
  if (key === 'pending' || key === 'failed') {
    return key;
  }
  return undefined;
}
