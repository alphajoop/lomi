/**
 * OrganizationsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class OrganizationsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Retrieve organization
     * @see OpenAPI `OrganizationsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/organizations/{id}']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/organizations/{id}']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/organizations/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Organization metrics
     * @see OpenAPI `OrganizationsController_getMetrics`
     */
    public async getMetrics(options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/organizations/metrics']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/organizations/metrics']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/organizations/metrics',
            ...options,
        });
    }

    /**
     * List organizations
     * @see OpenAPI `OrganizationsController_findAll`
     */
    public async list(options?: import("../../request-options.js").LomiRequestOptions): Promise<paths['/organizations']['get']['responses'][200]['content']['application/json']> {
        return requestWithClient<paths['/organizations']['get']['responses'][200]['content']['application/json']>(this.client, {
            method: 'GET',
            url: '/organizations',
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
            const response = await requestWithClient<paths['/organizations']['get']['responses'][200]['content']['application/json']>(this.client, {
                method: 'GET',
                url: '/organizations',
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
}
