import type { ChargeNextActionDto } from './dto/charge-next-action.dto';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Derive next_action from a Wave direct-charge payload. */
export function deriveWaveChargeNextAction(
  payload: Record<string, unknown>,
): ChargeNextActionDto | undefined {
  const directUrl =
    readString(payload.wave_launch_url) ?? readString(payload.checkout_url);
  if (directUrl) {
    return { type: 'redirect', url: directUrl };
  }

  const data = payload.data;
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    const nestedUrl =
      readString(nested.wave_launch_url) ?? readString(nested.checkout_url);
    if (nestedUrl) {
      return { type: 'redirect', url: nestedUrl };
    }
  }

  const status = readString(payload.status)?.toUpperCase();
  if (status === 'PENDING') {
    return { type: 'await_webhook', status: 'PENDING' };
  }

  return undefined;
}

/** Derive next_action from an MTN direct-charge data object. */
export function deriveMtnChargeNextAction(data: {
  status?: string;
}): ChargeNextActionDto {
  const status = (data.status ?? 'PENDING').toUpperCase();
  if (status === 'COMPLETED') {
    return { type: 'await_webhook', status: 'completed' };
  }
  return { type: 'await_webhook', status };
}

/** Derive next_action from a card charge data object. */
export function deriveCardChargeNextAction(data: {
  client_secret?: string | null;
  status?: string;
}): ChargeNextActionDto | undefined {
  const clientSecret = readString(data.client_secret ?? undefined);
  if (clientSecret) {
    return { type: 'client_secret', client_secret: clientSecret };
  }
  const status = readString(data.status);
  if (status === 'requires_action') {
    return { type: 'client_secret', status };
  }
  return undefined;
}

export function attachChargeNextAction<T extends Record<string, unknown>>(
  payload: T,
  nextAction: ChargeNextActionDto | undefined,
): T & { next_action?: ChargeNextActionDto } {
  if (!nextAction) {
    return payload;
  }
  return { ...payload, next_action: nextAction };
}
