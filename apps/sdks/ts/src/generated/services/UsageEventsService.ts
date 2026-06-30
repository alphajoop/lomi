/**
 * UsageEventsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class UsageEventsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Record a usage event
     * @see OpenAPI `UsageEventsController_ingest`
     */
    public async create(options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/usage-events']['post']['responses'][202]['content']['application/json']> {
        return requestWithClient<paths['/usage-events']['post']['responses'][202]['content']['application/json']>(this.client, {
            method: 'POST',
            url: '/usage-events',
            ...options,
        });
    }

    /**
     * Get a usage event
     * @see OpenAPI `UsageEventsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/usage-events/{id}']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/usage-events/{id}']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/usage-events/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List usage events
     * @see OpenAPI `UsageEventsController_findAll`
     */
    public async list(params?: paths['/usage-events']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/usage-events']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/usage-events']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/usage-events',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/usage-events']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/usage-events']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
