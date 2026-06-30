/**
 * CustomersService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class CustomersService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create a customer
     * @see OpenAPI `CustomersController_create`
     */
    public async create(body: paths['/customers']['post']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers']['post']['responses'][201]['content']['application/json']> {
        return requestWithClient<paths['/customers']['post']['responses'][201]['content']['application/json']>(this.client, {
            method: 'POST',
            url: '/customers',
            body,
            ...options,
        });
    }

    /**
     * Create customer portal session
     * @see OpenAPI `CustomersController_createPortalLaunchSession`
     */
    public async createPortalLaunchSession(id: string, body: paths['/customers/{id}/portal-launch-session']['post']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers/{id}/portal-launch-session']['post']['responses'][201]['content']['application/json']> {
        return requestWithClient<paths['/customers/{id}/portal-launch-session']['post']['responses'][201]['content']['application/json']>(this.client, {
            method: 'POST',
            url: '/customers/{id}/portal-launch-session',
            path: { id: id },
            body,
            ...options,
        });
    }

    /**
     * Remove a customer
     * @see OpenAPI `CustomersController_remove`
     */
    public async delete(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers/{id}']['delete']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/customers/{id}']['delete']['responses'][200]['content']['application/json']>(this.client, {
            method: 'DELETE',
            url: '/customers/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Retrieve a customer
     * @see OpenAPI `CustomersController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers/{id}']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/customers/{id}']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/customers/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Customer portal audit log
     * @see OpenAPI `CustomersController_getPortalAudit`
     */
    public async getPortalAudit(id: string, params?: paths['/customers/{id}/portal-audit']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/customers/{id}/portal-audit',
            path: { id: id },
            query: params,
            ...options,
        });
    }

    /**
     * List customer transactions
     * @see OpenAPI `CustomersController_getTransactions`
     */
    public async getTransactions(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers/{id}/transactions']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/customers/{id}/transactions']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/customers/{id}/transactions',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List customers
     * @see OpenAPI `CustomersController_findAll`
     */
    public async list(params?: paths['/customers']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/customers']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/customers',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/customers']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/customers']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
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
     * Update a customer
     * @see OpenAPI `CustomersController_update`
     */
    public async update(id: string, body: paths['/customers/{id}']['patch']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/customers/{id}']['patch']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/customers/{id}']['patch']['responses'][200]['content']['application/json']>(this.client, {
            method: 'PATCH',
            url: '/customers/{id}',
            path: { id: id },
            body,
            ...options,
        });
    }
}
