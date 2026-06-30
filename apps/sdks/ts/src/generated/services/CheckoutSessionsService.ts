/**
 * CheckoutSessionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class CheckoutSessionsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create checkout session
     * @see OpenAPI `CheckoutSessionsController_create`
     */
    public async create(body: NonNullable<paths['/checkout-sessions']['post']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['CheckoutSessionResponseDto']> {
        return requestWithClient<components['schemas']['CheckoutSessionResponseDto']>(this.client, {
            method: 'POST',
            url: '/checkout-sessions',
            body,
            ...options,
        });
    }

    /**
     * Retrieve checkout session
     * @see OpenAPI `CheckoutSessionsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['CheckoutSessionResponseDto']> {
        return requestWithClient<components['schemas']['CheckoutSessionResponseDto']>(this.client, {
            method: 'GET',
            url: '/checkout-sessions/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List checkout sessions
     * @see OpenAPI `CheckoutSessionsController_findAll`
     */
    public async list(params?: paths['/checkout-sessions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/checkout-sessions']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/checkout-sessions']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/checkout-sessions',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/checkout-sessions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/checkout-sessions']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
