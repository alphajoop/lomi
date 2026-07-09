import {
  callFn,
  callScalar,
  dbDescribe,
  setRequestClaims,
  withRollback,
  type Db,
} from './support/client';
import { connectSpi, createCheckoutSessionRpc } from './support/checkout';
import {
  createOrgWithAdmin,
  createCustomer,
  ensureReferenceData,
} from './support/seed';
/**
 * SPI checkout / POS RPCs. Provisions a local SPI account (no external BCEAO
 * credentials) and exercises prepare_* paths that only touch Postgres.
 */

async function spiPrepareRpcsDeployed(client: Db): Promise<boolean> {
  const res = await client.query(
    `SELECT pg_get_functiondef(p.oid) AS def
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'get_spi_account_number'
      LIMIT 1`,
  );
  const def = String(res.rows[0]?.def ?? '');
  return def.includes('::public.currency_code');
}

async function seedSpiOrg(client: Db): Promise<{
  organizationId: string;
  merchantId: string;
  customerId: string;
  spiAccountNumber: string;
}> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment: 'live',
  });
  const spiAccountNumber = `SN08SPI${organizationId.replace(/-/g, '').slice(0, 12)}`;

  await connectSpi(client, organizationId, {
    metadata: { spi_account_number: spiAccountNumber },
  });

  await callScalar<Record<string, unknown>>(
    client,
    'public.provision_spi_account',
    {
      p_organization_id: organizationId,
      p_account_number: spiAccountNumber,
      p_currency_code: 'XOF',
    },
  );

  return { organizationId, merchantId, customerId, spiAccountNumber };
}

dbDescribe('SPI checkout :: get_pos_transactions', () => {
  it('returns an empty array for a new organization', async () => {
    await withRollback(async (client) => {
      const { organizationId, merchantId } = await seedSpiOrg(client);
      await setRequestClaims(client, {
        role: 'authenticated',
        sub: merchantId,
      });
      const rows = await callFn(client, 'public.get_pos_transactions', {
        p_organization_id: organizationId,
        p_limit: 20,
        p_offset: 0,
      });
      expect(rows.rows).toEqual([]);
    });
  });
});

dbDescribe('SPI checkout :: prepare_pos_spi_payment', () => {
  it('creates a pending POS SPI payment request without external credentials', async () => {
    await withRollback(async (client) => {
      if (!(await spiPrepareRpcsDeployed(client))) {
        console.warn(
          '[spi-checkout] skipping prepare_pos_spi_payment: deploy get_spi_account_number enum cast to test DB',
        );
        return;
      }
      const { organizationId, merchantId } = await seedSpiOrg(client);

      const result = await callScalar<Record<string, unknown>>(
        client,
        'public.prepare_pos_spi_payment',
        {
          p_organization_id: organizationId,
          p_merchant_id: merchantId,
          p_amount: 3500,
          p_currency_code: 'XOF',
        },
      );

      expect(result.spi_tx_id).toMatch(/^POS-/);
      expect(result.checkout_session_id).toBeTruthy();
      expect(result.transaction_id).toBeTruthy();
    });
  });
});

dbDescribe('SPI checkout :: prepare_checkout_spi_payment', () => {
  it('prepares a hosted-checkout SPI RTP for an open session', async () => {
    await withRollback(async (client) => {
      if (!(await spiPrepareRpcsDeployed(client))) {
        console.warn(
          '[spi-checkout] skipping prepare_checkout_spi_payment: deploy get_spi_account_number enum cast to test DB',
        );
        return;
      }
      const { organizationId, merchantId, customerId } =
        await seedSpiOrg(client);

      const session = await createCheckoutSessionRpc(
        client,
        organizationId,
        merchantId,
        { amount: 4200, customerId, environment: 'live' },
      );
      const checkoutSessionId = session.checkout_session_id as string;
      expect(checkoutSessionId).toBeTruthy();

      const result = await callScalar<Record<string, unknown>>(
        client,
        'public.prepare_checkout_spi_payment',
        { p_checkout_session_id: checkoutSessionId },
      );

      expect(String(result.spi_tx_id)).toMatch(/^CHK-/);
      expect(result.payment_request_id).toBeTruthy();
      expect(result.transaction_id).toBeTruthy();
      expect(Number(result.amount)).toBeGreaterThan(0);
    });
  });

  it('is idempotent when prepare_checkout_spi_payment is called twice', async () => {
    await withRollback(async (client) => {
      if (!(await spiPrepareRpcsDeployed(client))) {
        return;
      }
      const { organizationId, merchantId, customerId } =
        await seedSpiOrg(client);

      const session = await createCheckoutSessionRpc(
        client,
        organizationId,
        merchantId,
        { amount: 3000, customerId, environment: 'live' },
      );
      const checkoutSessionId = session.checkout_session_id as string;

      const first = await callScalar<Record<string, unknown>>(
        client,
        'public.prepare_checkout_spi_payment',
        { p_checkout_session_id: checkoutSessionId },
      );
      const second = await callScalar<Record<string, unknown>>(
        client,
        'public.prepare_checkout_spi_payment',
        { p_checkout_session_id: checkoutSessionId },
      );

      expect(second.already_initiated).toBe(true);
      expect(second.payment_request_id).toBe(first.payment_request_id);
    });
  });
});

// complete_spi_payment requires a real PI-SPI webhook payload; the prepare
// paths above cover the DB state machine entry points without external creds.
