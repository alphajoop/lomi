/**
 * UsageSubscriptionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class UsageSubscriptionsService {
    /**
     * OpenAPI operationId: `UsageEventsController_createUsageSubscription`.
     * Create a usage subscription
     */
    public static async create(): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/usage-subscriptions',
        });
    }
}
