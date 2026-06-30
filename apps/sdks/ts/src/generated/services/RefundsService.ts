/**
 * RefundsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class RefundsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create refund
     * @see OpenAPI `RefundsController_create`
     */
    public async create(body: paths['/refunds']['post']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/refunds']['post']['responses'][201]['content']['application/json']> {
        return requestWithClient<paths['/refunds']['post']['responses'][201]['content']['application/json']>(this.client, {
            method: 'POST',
            url: '/refunds',
            body,
            ...options,
        });
    }

    /**
     * Get refund
     * @see OpenAPI `RefundsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/refunds/{id}']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/refunds/{id}']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/refunds/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List refunds
     * @see OpenAPI `RefundsController_findAll`
     */
    public async list(params?: paths['/refunds']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/refunds',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/refunds']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/refunds']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
