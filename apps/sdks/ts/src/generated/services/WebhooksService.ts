/**
 * WebhooksService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';
import { verifyWebhookSignature } from '../../webhook-verify.js';

export class WebhooksService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create webhook
     * @see OpenAPI `WebhooksController_create`
     */
    public async create(options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/webhooks',
            ...options,
        });
    }

    /**
     * Delete webhook
     * @see OpenAPI `WebhooksController_remove`
     */
    public async delete(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'DELETE',
            url: '/webhooks/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Retrieve webhook
     * @see OpenAPI `WebhooksController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/webhooks/{id}']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/webhooks/{id}']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/webhooks/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List webhooks
     * @see OpenAPI `WebhooksController_findAll`
     */
    public async list(options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/webhooks']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/webhooks']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/webhooks',
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = 1;
        const pageSize = 50;

        while (true) {
            const response = await requestWithClient<NonNullable<NonNullable<paths['/webhooks']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
                method: 'GET',
                url: '/webhooks',
                query: { page, pageSize },
                ...options,
            });

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
     * Retry webhook delivery
     * @see OpenAPI `WebhooksController_retryDelivery`
     */
    public async retryDelivery(webhookId: string, logId: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/webhooks/{webhookId}/logs/{logId}/retry',
            path: { webhookId: webhookId, logId: logId },
            ...options,
        });
    }

    /**
     * Test webhook
     * @see OpenAPI `WebhooksController_test`
     */
    public async test(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/webhooks/{id}/test',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Update webhook
     * @see OpenAPI `WebhooksController_update`
     */
    public async update(id: string, body: NonNullable<paths['/webhooks/{id}']['patch']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/webhooks/{id}']['patch']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/webhooks/{id}']['patch']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'PATCH',
            url: '/webhooks/{id}',
            path: { id: id },
            body,
            ...options,
        });
    }

    /**
     * Verify an incoming webhook signature (HMAC SHA-256).
     */
    public verifySignature(
        rawBody: string | Buffer,
        signature: string,
        secret: string,
    ): boolean {
        return verifyWebhookSignature(rawBody, signature, secret);
    }
}
