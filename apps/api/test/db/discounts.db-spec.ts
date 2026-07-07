import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  createCoupon,
  createCustomer,
  createOrgWithAdmin,
  createPrice,
  createProduct,
  ensureReferenceData,
  linkCouponToProduct,
} from './support/seed';
import { createTx, seedPaymentCtx } from './support/payments';

/**
 * Coupon validation at checkout: happy path, expiry, quantity caps, and
 * customer-type restrictions.
 */

interface CouponValidationRow {
  is_valid: boolean;
  coupon_id: string | null;
  discount_type: string | null;
  discount_percentage: number | null;
  discount_fixed_amount: number | null;
  max_quantity_per_use: number | null;
  message: string | null;
  customer_eligible?: boolean;
}

async function validateCoupon(
  client: Db,
  args: {
    organizationId: string;
    code: string;
    productId?: string | null;
    quantity?: number;
    customerId?: string | null;
  },
): Promise<CouponValidationRow> {
  const res = await callFn(client, 'public.validate_coupon_for_checkout', {
    p_organization_id: args.organizationId,
    p_coupon_code: args.code,
    p_product_id: args.productId ?? null,
    p_quantity: args.quantity ?? 1,
    p_customer_id: args.customerId ?? null,
  });
  return res.rows[0] as CouponValidationRow;
}

dbDescribe('Discounts :: validate_coupon_for_checkout', () => {
  it('accepts a valid organization-wide percentage coupon', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const customerId = await createCustomer(client, organizationId);
      const productId = await createProduct(client, organizationId, {
        type: 'one_time',
      });
      const code = `VALID10_${randomUUID().slice(0, 6)}`;
      const couponId = await createCoupon(client, organizationId, {
        code,
        discountPercentage: 10,
      });

      const row = await validateCoupon(client, {
        organizationId,
        code,
        productId,
        customerId,
      });

      expect(row.is_valid).toBe(true);
      expect(row.coupon_id).toBe(couponId);
      expect(row.discount_type).toBe('percentage');
      expect(Number(row.discount_percentage)).toBe(10);
    });
  });

  it('rejects an unknown coupon code', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);

      const row = await validateCoupon(client, {
        organizationId,
        code: 'DOES_NOT_EXIST',
      });

      expect(row.is_valid).toBe(false);
      expect(row.coupon_id).toBeNull();
      expect(String(row.message)).toMatch(/invalid coupon/i);
    });
  });

  it('rejects an expired coupon', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const code = `EXPIRED_${randomUUID().slice(0, 6)}`;
      await createCoupon(client, organizationId, {
        code,
        expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
      });

      const row = await validateCoupon(client, { organizationId, code });
      expect(row.is_valid).toBe(false);
      expect(String(row.message)).toMatch(/expired/i);
    });
  });

  it('rejects quantities above max_quantity_per_use', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const code = `QTYCAP_${randomUUID().slice(0, 6)}`;
      await createCoupon(client, organizationId, {
        code,
        maxQuantityPerUse: 2,
      });

      const row = await validateCoupon(client, {
        organizationId,
        code,
        quantity: 5,
      });
      expect(row.is_valid).toBe(false);
      expect(String(row.message)).toMatch(/maximum quantity/i);
    });
  });

  it('rejects new-customer-only coupons for returning customers', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'test');
      const productId = await createProduct(client, ctx.organizationId, {
        type: 'one_time',
        environment: 'test',
      });
      await createPrice(client, productId, ctx.organizationId, {
        environment: 'test',
      });

      const txId = await createTx(client, ctx, { environment: 'test' });
      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        {
          p_transaction_id: txId,
        },
      );

      const code = `NEWONLY_${randomUUID().slice(0, 6)}`;
      await createCoupon(client, ctx.organizationId, {
        code,
        customerType: 'new',
        environment: 'live',
      });

      const row = await validateCoupon(client, {
        organizationId: ctx.organizationId,
        code,
        productId,
        customerId: ctx.customerId,
      });

      expect(row.is_valid).toBe(false);
      expect(row.customer_eligible).toBe(false);
    });
  });

  it('rejects coupons scoped to specific products when product is not linked', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const linkedProduct = await createProduct(client, organizationId);
      const otherProduct = await createProduct(client, organizationId);
      const code = `SCOPED_${randomUUID().slice(0, 6)}`;
      const couponId = await createCoupon(client, organizationId, {
        code,
        scopeType: 'specific_products',
      });
      await linkCouponToProduct(client, couponId, linkedProduct);

      const row = await validateCoupon(client, {
        organizationId,
        code,
        productId: otherProduct,
      });

      expect(row.is_valid).toBe(false);
      expect(String(row.message)).toMatch(
        /does not apply|not applicable|product/i,
      );
    });
  });

  it('accepts a valid fixed-amount coupon', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const customerId = await createCustomer(client, organizationId);
      const productId = await createProduct(client, organizationId, {
        type: 'one_time',
      });
      const code = `FIXED500_${randomUUID().slice(0, 6)}`;
      const couponId = await createCoupon(client, organizationId, {
        code,
        discountType: 'fixed',
        discountFixedAmount: 500,
      });

      const row = await validateCoupon(client, {
        organizationId,
        code,
        productId,
        customerId,
      });

      expect(row.is_valid).toBe(true);
      expect(row.coupon_id).toBe(couponId);
      expect(row.discount_type).toBe('fixed');
      expect(Number(row.discount_fixed_amount)).toBe(500);
    });
  });

  it('accepts a product-scoped coupon for a linked product', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const linkedProduct = await createProduct(client, organizationId);
      const code = `SCOPEOK_${randomUUID().slice(0, 6)}`;
      const couponId = await createCoupon(client, organizationId, {
        code,
        scopeType: 'specific_products',
      });
      await linkCouponToProduct(client, couponId, linkedProduct);

      const row = await validateCoupon(client, {
        organizationId,
        code,
        productId: linkedProduct,
      });

      expect(row.is_valid).toBe(true);
      expect(row.coupon_id).toBe(couponId);
    });
  });

  it('rejects a coupon that has reached its maximum uses', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const code = `MAXED_${randomUUID().slice(0, 6)}`;
      const couponId = await createCoupon(client, organizationId, {
        code,
        maxUses: 1,
      });
      await client.query(
        `UPDATE public.discount_coupons SET current_uses = max_uses
          WHERE coupon_id = $1`,
        [couponId],
      );

      const row = await validateCoupon(client, { organizationId, code });
      expect(row.is_valid).toBe(false);
      expect(String(row.message)).toMatch(/maximum uses/i);
    });
  });
});
