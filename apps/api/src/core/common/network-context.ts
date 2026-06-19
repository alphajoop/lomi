import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { SupabaseService } from '../../utils/supabase/supabase.service';
import type { AuthContext } from './decorators/current-user.decorator';

type NetworkContextReference = {
  transactionId?: string | null;
  checkoutSessionId?: string | null;
  refundId?: string | null;
};

type RecordNetworkContextOptions = NetworkContextReference & {
  amount?: number | null;
  currencyCode?: string | null;
  capabilityKey: string;
  metadata?: Record<string, unknown>;
  paymentEventIdempotencyKey?: string | null;
  enqueuePaymentCreated?: boolean;
};

type RecordNetworkContextResult = {
  contextId: string | null;
  operatorFeeAmount: number;
  operatorFeeCurrency: string | null;
  operatorFeeRuleId: string | null;
  feeEntryId: string | null;
};

export type { RecordNetworkContextResult };

const networkLogger = new Logger('NetworkContext');

export function isNetworkRequest(user: AuthContext): boolean {
  return Boolean(user.isNetworkRequest && user.networkMembershipId);
}

export function buildNetworkProviderMetadata(
  user: AuthContext,
): Record<string, string> {
  if (!isNetworkRequest(user)) {
    return {};
  }

  return {
    lomi_network_request: 'true',
    actor_organization_id: user.actorOrganizationId ?? user.organizationId,
    target_organization_id: user.targetOrganizationId ?? user.organizationId,
    network_account_id: user.networkAccountId ?? '',
    network_membership_id: user.networkMembershipId ?? '',
    lomi_account: user.lomiAccount ?? '',
    public_account_id: user.publicAccountId ?? user.lomiAccount ?? '',
  };
}

export function buildNetworkCustomerMetadata(
  user: AuthContext,
  source: string = 'api',
): Record<string, unknown> {
  if (!isNetworkRequest(user)) {
    return {};
  }

  return {
    network: {
      operator_organization_id: user.actorOrganizationId ?? user.organizationId,
      member_organization_id: user.targetOrganizationId ?? user.organizationId,
      network_membership_id: user.networkMembershipId,
      network_account_id: user.networkAccountId,
      public_account_id: user.publicAccountId ?? user.lomiAccount,
      source,
    },
  };
}

export function namespaceNetworkIdempotency(
  user: AuthContext,
  idempotency?: { key: string; bodyHash: string },
): { key: string; bodyHash: string } | undefined {
  if (!idempotency || !isNetworkRequest(user)) {
    return idempotency;
  }

  const rawKeyHash = createHash('sha256').update(idempotency.key).digest('hex');
  const bodyHash = createHash('sha256')
    .update(
      JSON.stringify({
        body_hash: idempotency.bodyHash,
        lomi_account: user.lomiAccount ?? user.publicAccountId ?? null,
        network_membership_id: user.networkMembershipId,
      }),
    )
    .digest('hex');

  return {
    key: `network:${user.networkMembershipId}:${rawKeyHash}`.slice(0, 255),
    bodyHash,
  };
}

export function assertNetworkContextRecorded(
  user: AuthContext,
  result: RecordNetworkContextResult | null,
  operation: string,
): void {
  if (!isNetworkRequest(user)) {
    return;
  }

  if (!result?.contextId) {
    throw new InternalServerErrorException(
      `Network bookkeeping failed during ${operation}`,
    );
  }
}

/** Member merchant for ledger attribution on delegated member-org operations. */
export async function resolveNetworkMemberMerchantId(
  supabase: SupabaseService,
  user: AuthContext,
): Promise<string> {
  if (!isNetworkRequest(user)) {
    return user.merchantId;
  }

  const { data, error } = await (supabase.getClient() as any).rpc(
    'resolve_network_member_merchant_id',
    { p_network_membership_id: user.networkMembershipId },
  );

  if (error) {
    throw new BadRequestException(error.message);
  }

  if (typeof data !== 'string' || !data) {
    throw new BadRequestException('Network membership not found');
  }

  return data;
}

export async function recordNetworkContext(
  supabase: SupabaseService,
  user: AuthContext,
  options: RecordNetworkContextOptions,
): Promise<RecordNetworkContextResult | null> {
  if (!isNetworkRequest(user)) {
    return null;
  }

  try {
    const membershipId = user.networkMembershipId!;
    const feeRuleId = await fetchOperatorFeeRuleId(supabase, membershipId);
    const feeAmount =
      feeRuleId && options.amount && options.amount > 0 && options.currencyCode
        ? await calculateOperatorFee(
            supabase,
            feeRuleId,
            options.amount,
            options.currencyCode,
          )
        : 0;
    const feeCurrency = feeAmount > 0 ? options.currencyCode! : null;

    const { data: contextId, error: contextError } = await (
      supabase.getClient() as any
    ).rpc('record_network_transaction_context', {
      p_network_membership_id: membershipId,
      p_transaction_id: options.transactionId ?? null,
      p_checkout_session_id: options.checkoutSessionId ?? null,
      p_refund_id: options.refundId ?? null,
      p_api_key: user.apiKey ?? null,
      p_actor_merchant_id: user.merchantId,
      p_capability_key: options.capabilityKey,
      p_operator_fee_amount: feeAmount,
      p_operator_fee_currency: feeCurrency,
      p_environment: user.environment,
      p_metadata: {
        lomi_account: user.lomiAccount,
        ...(options.metadata ?? {}),
      },
    });

    if (contextError) {
      networkLogger.error(
        `record_network_transaction_context failed: ${contextError.message}`,
      );
      return null;
    }

    let feeEntryId: string | null = null;
    if (feeAmount > 0 && options.transactionId) {
      feeEntryId = await recordOperatorFeeEntry(supabase, user, {
        membershipId,
        feeRuleId,
        contextId: contextId as string,
        transactionId: options.transactionId,
        amount: feeAmount,
        currencyCode: options.currencyCode!,
        metadata: options.metadata,
      });
    }

    if (options.enqueuePaymentCreated && options.transactionId) {
      const enriched = await fetchNetworkWebhookEnrichment(
        supabase,
        user,
        options.transactionId,
      );
      await enqueueNetworkWebhook(
        supabase,
        user.actorOrganizationId ?? user.organizationId,
        {
          event: 'NETWORK_PAYMENT_CREATED',
          idempotencyKey:
            options.paymentEventIdempotencyKey ||
            `network_payment_${options.transactionId}`,
          payload: {
            transaction_id: options.transactionId,
            checkout_session_id: options.checkoutSessionId ?? null,
            network_account_id: user.networkAccountId,
            public_account_id: user.publicAccountId ?? user.lomiAccount,
            network_membership_id: membershipId,
            member_organization_id:
              user.targetOrganizationId ?? user.organizationId,
            member_organization_name: enriched.memberOrganizationName,
            customer_id: enriched.customerId,
            ...(options.metadata ?? {}),
          },
        },
      );
    }

    if (feeEntryId && !options.transactionId) {
      const enriched = { memberOrganizationName: null, customerId: null };
      await enqueueNetworkWebhook(
        supabase,
        user.actorOrganizationId ?? user.organizationId,
        {
          event: 'NETWORK_OPERATOR_FEE_CREATED',
          idempotencyKey: `network_operator_fee_${feeEntryId}`,
          payload: {
            operator_fee_entry_id: feeEntryId,
            transaction_id: options.transactionId,
            amount: feeAmount,
            currency_code: options.currencyCode,
            network_account_id: user.networkAccountId,
            public_account_id: user.publicAccountId ?? user.lomiAccount,
            network_membership_id: membershipId,
            member_organization_id:
              user.targetOrganizationId ?? user.organizationId,
            member_organization_name: enriched.memberOrganizationName,
            customer_id: enriched.customerId,
          },
        },
      );
    }

    return {
      contextId: contextId as string,
      operatorFeeAmount: feeAmount,
      operatorFeeCurrency: feeCurrency,
      operatorFeeRuleId: feeRuleId,
      feeEntryId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    networkLogger.error(`Network context recording failed: ${message}`);
    return null;
  }
}

export async function upsertNetworkCustomerMetadata(
  supabase: SupabaseService,
  user: AuthContext,
  customerId: string,
  metadata?: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  if (!isNetworkRequest(user)) {
    return null;
  }

  const { data, error } = await (supabase.getClient() as any).rpc(
    'upsert_network_customer_metadata_for_api',
    {
      p_network_membership_id: user.networkMembershipId,
      p_customer_id: customerId,
      p_public_account_id: user.publicAccountId ?? user.lomiAccount ?? null,
      p_metadata: {
        ...(metadata ?? {}),
        ...buildNetworkCustomerMetadata(user),
      },
    },
  );

  if (error) {
    networkLogger.error(
      `upsert_network_customer_metadata_for_api failed: ${error.message}`,
    );
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === 'object'
    ? (row as Record<string, unknown>)
    : null;
}

export async function recordNetworkOperatorFeeReversal(
  supabase: SupabaseService,
  user: AuthContext,
  params: {
    refundId?: string | null;
    transactionId: string;
    refundAmount: number;
    metadata?: Record<string, unknown>;
  },
): Promise<string | null> {
  if (!isNetworkRequest(user) || !params.refundId) {
    return null;
  }

  const { data, error } = await (supabase.getClient() as any).rpc(
    'record_network_operator_fee_reversal',
    {
      p_network_membership_id: user.networkMembershipId,
      p_refund_id: params.refundId,
      p_transaction_id: params.transactionId,
      p_refund_amount: params.refundAmount,
      p_metadata: {
        lomi_account: user.lomiAccount,
        public_account_id: user.publicAccountId ?? user.lomiAccount,
        ...(params.metadata ?? {}),
      },
    },
  );

  if (error) {
    networkLogger.error(
      `record_network_operator_fee_reversal failed: ${error.message}`,
    );
    return null;
  }

  const reversalEntryId = typeof data === 'string' ? data : null;
  if (reversalEntryId) {
    const { data: feeRows } = await (supabase.getClient() as any).rpc(
      'get_network_operator_fee_entry_summary',
      { p_operator_fee_entry_id: reversalEntryId },
    );
    const feeRow = Array.isArray(feeRows) ? feeRows[0] : feeRows;

    await enqueueNetworkWebhook(
      supabase,
      user.actorOrganizationId ?? user.organizationId,
      {
        event: 'NETWORK_OPERATOR_FEE_REVERSED',
        idempotencyKey: `network_operator_fee_reversed_${reversalEntryId}`,
        payload: {
          operator_fee_entry_id: reversalEntryId,
          public_account_id: user.publicAccountId ?? user.lomiAccount,
          network_membership_id: user.networkMembershipId,
          member_organization_id:
            user.targetOrganizationId ?? user.organizationId,
          transaction_id: params.transactionId,
          refund_id: params.refundId,
          operator_fee_amount: Number(feeRow?.amount ?? params.refundAmount),
          operator_fee_currency:
            feeRow?.currency_code ?? params.metadata?.currency_code ?? null,
        },
      },
    );
  }

  return reversalEntryId;
}

async function fetchOperatorFeeRuleId(
  supabase: SupabaseService,
  membershipId: string,
): Promise<string | null> {
  const { data, error } = await (supabase.getClient() as any).rpc(
    'get_network_membership_operator_fee_rule_id',
    { p_network_membership_id: membershipId },
  );

  if (error) {
    networkLogger.error(
      `network_membership fee lookup failed: ${error.message}`,
    );
    return null;
  }

  return typeof data === 'string' ? data : null;
}

async function calculateOperatorFee(
  supabase: SupabaseService,
  feeRuleId: string,
  amount: number,
  currencyCode: string,
): Promise<number> {
  const { data, error } = await (supabase.getClient() as any).rpc(
    'calculate_network_operator_fee',
    {
      p_fee_rule_id: feeRuleId,
      p_amount: amount,
      p_currency_code: currencyCode,
    },
  );

  if (error) {
    networkLogger.error(
      `calculate_network_operator_fee failed: ${error.message}`,
    );
    return 0;
  }

  return Number(data ?? 0);
}

async function recordOperatorFeeEntry(
  supabase: SupabaseService,
  user: AuthContext,
  params: {
    membershipId: string;
    feeRuleId: string | null;
    contextId: string;
    transactionId: string;
    amount: number;
    currencyCode: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { data, error } = await (supabase.getClient() as any).rpc(
    'record_network_operator_fee_entry',
    {
      p_network_membership_id: params.membershipId,
      p_amount: params.amount,
      p_currency_code: params.currencyCode,
      p_entry_type: 'charge',
      p_fee_rule_id: params.feeRuleId,
      p_network_transaction_context_id: params.contextId,
      p_transaction_id: params.transactionId,
      p_refund_id: null,
      p_description: 'Operator fee for delegated payment',
      p_metadata: {
        lomi_account: user.lomiAccount,
        ...(params.metadata ?? {}),
      },
    },
  );

  if (error) {
    networkLogger.error(
      `record_network_operator_fee_entry failed: ${error.message}`,
    );
    return null;
  }

  return typeof data === 'string' ? data : null;
}

async function fetchNetworkWebhookEnrichment(
  supabase: SupabaseService,
  user: AuthContext,
  transactionId: string,
): Promise<{
  memberOrganizationName: string | null;
  customerId: string | null;
}> {
  const memberOrganizationId =
    user.targetOrganizationId ?? user.organizationId ?? null;

  const { data } = await (supabase.getClient() as any).rpc(
    'get_network_webhook_enrichment',
    {
      p_member_organization_id: memberOrganizationId,
      p_transaction_id: transactionId,
    },
  );

  const row = Array.isArray(data) ? data[0] : data;

  return {
    memberOrganizationName:
      typeof row?.member_organization_name === 'string'
        ? row.member_organization_name
        : null,
    customerId: typeof row?.customer_id === 'string' ? row.customer_id : null,
  };
}

async function enqueueNetworkWebhook(
  supabase: SupabaseService,
  operatorOrganizationId: string,
  params: {
    event:
      | 'NETWORK_PAYMENT_CREATED'
      | 'NETWORK_OPERATOR_FEE_CREATED'
      | 'NETWORK_OPERATOR_FEE_REVERSED';
    idempotencyKey: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await (supabase.getClient() as any).rpc(
    'enqueue_network_webhook_event',
    {
      p_operator_organization_id: operatorOrganizationId,
      p_event: params.event,
      p_idempotency_key: params.idempotencyKey,
      p_payload: params.payload,
    },
  );

  if (error) {
    networkLogger.error(
      `enqueue_network_webhook_event failed: ${error.message}`,
    );
  }
}
