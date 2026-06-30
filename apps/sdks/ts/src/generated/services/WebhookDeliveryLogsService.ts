/**
 * WebhookDeliveryLogsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class WebhookDeliveryLogsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Retrieve webhook delivery log
     * @see OpenAPI `WebhookDeliveryLogsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['WebhookDeliveryLogResponseDto']> {
        return requestWithClient<components['schemas']['WebhookDeliveryLogResponseDto']>(this.client, {
            method: 'GET',
            url: '/webhook-delivery-logs/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List webhook delivery logs
     * @see OpenAPI `WebhookDeliveryLogsController_findAll`
     */
    public async list(params?: paths['/webhook-delivery-logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/webhook-delivery-logs']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/webhook-delivery-logs']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/webhook-delivery-logs',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/webhook-delivery-logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/webhook-delivery-logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
}
