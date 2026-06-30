/**
 * UsageBillingService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class UsageBillingService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Check customer entitlement
     * @see OpenAPI `UsageBillingController_checkEntitlement`
     */
    public async checkEntitlement(options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/usage-billing/entitlements/check',
            ...options,
        });
    }

    /**
     * Create or update an entitlement
     * @see OpenAPI `UsageBillingController_createEntitlement`
     */
    public async createEntitlement(options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/usage-billing/entitlements',
            ...options,
        });
    }

    /**
     * Combined revenue metrics
     * @see OpenAPI `UsageBillingController_getRevenue`
     */
    public async getRevenue(params?: paths['/usage-billing/revenue']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/usage-billing/revenue',
            query: params,
            ...options,
        });
    }

    /**
     * Get meter usage for a subscription
     * @see OpenAPI `UsageBillingController_getSubscriptionUsage`
     */
    public async getSubscriptionUsage(subscriptionId: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/usage-billing/subscriptions/{subscriptionId}/usage',
            path: { subscriptionId: subscriptionId },
            ...options,
        });
    }

    /**
     * Credit prepaid usage units
     * @see OpenAPI `UsageBillingController_creditWallet`
     */
    public async grantCredits(options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/usage-billing/credits',
            ...options,
        });
    }

    /**
     * List usage billing periods
     * @see OpenAPI `UsageBillingController_listPeriods`
     */
    public async listPeriods(params?: paths['/usage-billing/periods']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/usage-billing/periods',
            query: params,
            ...options,
        });
    }
}
