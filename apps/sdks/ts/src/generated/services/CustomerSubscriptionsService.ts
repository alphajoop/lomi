/**
 * CustomerSubscriptionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class CustomerSubscriptionsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Cancel customer subscription
     * @see OpenAPI `CustomerSubscriptionsController_remove`
     */
    public async delete(subscription_id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'DELETE',
            url: '/customer-subscriptions/{subscription_id}',
            path: { subscription_id: subscription_id },
            ...options,
        });
    }

    /**
     * Retrieve customer subscription
     * @see OpenAPI `CustomerSubscriptionsController_findOne`
     */
    public async get(subscription_id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/customer-subscriptions/{subscription_id}',
            path: { subscription_id: subscription_id },
            ...options,
        });
    }

    /**
     * List customer subscriptions
     * @see OpenAPI `CustomerSubscriptionsController_findAll`
     */
    public async list(params?: paths['/customer-subscriptions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/customer-subscriptions',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/customer-subscriptions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/customer-subscriptions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
                options,
            );

            const items =
                (response as { data?: unknown[] })?.data ??
                (response as { items?: unknown[] })?.items;

            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            for (const item of items) {
                yield item;
            }

            if (items.length < pageSize) {
                break;
            }

            page += 1;
        }
    }

    /**
     * Update customer subscription
     * @see OpenAPI `CustomerSubscriptionsController_update`
     */
    public async update(subscription_id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'PATCH',
            url: '/customer-subscriptions/{subscription_id}',
            path: { subscription_id: subscription_id },
            ...options,
        });
    }
}
