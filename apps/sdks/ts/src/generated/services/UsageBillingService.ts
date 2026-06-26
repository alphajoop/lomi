/**
 * UsageBillingService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class UsageBillingService {
    /**
     * OpenAPI operationId: `UsageBillingController_checkEntitlement`.
     * Check if a customer has an active entitlement
     */
    public static async checkEntitlement(): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-billing/entitlements/check',
        });
    }

    /**
     * OpenAPI operationId: `UsageBillingController_createEntitlement`.
     * Create or update a plan entitlement feature
     */
    public static async createEntitlement(): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/usage-billing/entitlements',
        });
    }

    /**
     * OpenAPI operationId: `UsageBillingController_getRevenue`.
     * Combined MRR + usage + one-time revenue metrics
     */
    public static async getRevenue(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-billing/revenue',
            query: options,
        });
    }

    /**
     * OpenAPI operationId: `UsageBillingController_getSubscriptionUsage`.
     * Get meter usage for a subscription
     */
    public static async getSubscriptionUsage(subscriptionId: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-billing/subscriptions/{subscriptionId}/usage',
            path: { subscriptionId: subscriptionId },
        });
    }

    /**
     * OpenAPI operationId: `UsageBillingController_creditWallet`.
     * Credit prepaid usage units to a customer meter wallet
     */
    public static async grantCredits(): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/usage-billing/credits',
        });
    }

    /**
     * OpenAPI operationId: `UsageBillingController_listPeriods`.
     * List usage billing periods
     */
    public static async listPeriods(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-billing/periods',
            query: options,
        });
    }
}
