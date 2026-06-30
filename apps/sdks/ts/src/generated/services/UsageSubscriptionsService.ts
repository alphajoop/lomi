/**
 * UsageSubscriptionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class UsageSubscriptionsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create a usage subscription
     * @see OpenAPI `UsageEventsController_createUsageSubscription`
     */
    public async create(options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['UsageSubscriptionResponseDto']> {
        return requestWithClient<components['schemas']['UsageSubscriptionResponseDto']>(this.client, {
            method: 'POST',
            url: '/usage-subscriptions',
            ...options,
        });
    }
}
