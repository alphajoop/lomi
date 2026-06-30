/**
 * PaymentLinksService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class PaymentLinksService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create payment link
     * @see OpenAPI `PaymentLinksController_create`
     */
    public async create(body: paths['/payment-links']['post']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/payment-links']['post']['responses'][201]['content']['application/json']> {
        return requestWithClient<paths['/payment-links']['post']['responses'][201]['content']['application/json']>(this.client, {
            method: 'POST',
            url: '/payment-links',
            body,
            ...options,
        });
    }

    /**
     * Retrieve payment link
     * @see OpenAPI `PaymentLinksController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/payment-links/{id}']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/payment-links/{id}']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/payment-links/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List payment links
     * @see OpenAPI `PaymentLinksController_findAll`
     */
    public async list(params?: paths['/payment-links']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/payment-links']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/payment-links']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/payment-links',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/payment-links']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/payment-links']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
