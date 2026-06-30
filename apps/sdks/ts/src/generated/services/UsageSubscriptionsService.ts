/**
 * UsageSubscriptionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class UsageSubscriptionsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create a usage subscription
     * @see OpenAPI `UsageEventsController_createUsageSubscription`
     */
    public async create(options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/usage-subscriptions']['post']['responses'][201]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/usage-subscriptions']['post']['responses'][201]>['content']>['application/json']>>(this.client, {
            method: 'POST',
            url: '/usage-subscriptions',
            ...options,
        });
    }
}
