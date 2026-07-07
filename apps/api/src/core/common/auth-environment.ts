import type { AuthContext } from './decorators/current-user.decorator';
import {
  LomiPaymentEnvironment,
  normalizePaymentEnvironment,
} from '../../utils/payment-environment';

/** Ledger environment from API key auth, never trust client-supplied environment on DTOs. */
export function environmentFromAuth(user: AuthContext): LomiPaymentEnvironment {
  return normalizePaymentEnvironment(user.environment);
}
