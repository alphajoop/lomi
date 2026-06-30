/**
 * MerchantsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class MerchantsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Get merchant details
     * @see OpenAPI `MerchantsController_getDetails`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/merchants/{id}']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/merchants/{id}']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/merchants/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Get merchant ARR
     * @see OpenAPI `MerchantsController_getArr`
     */
    public async getArr(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/merchants/{id}/arr']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/merchants/{id}/arr']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/merchants/{id}/arr',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Get merchant balance
     * @see OpenAPI `MerchantsController_getBalance`
     */
    public async getBalance(id: string, params?: paths['/merchants/{id}/balance']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/merchants/{id}/balance']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/merchants/{id}/balance']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/merchants/{id}/balance',
            path: { id: id },
            query: params,
            ...options,
        });
    }

    /**
     * Get merchant MRR
     * @see OpenAPI `MerchantsController_getMrr`
     */
    public async getMrr(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/merchants/{id}/mrr']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/merchants/{id}/mrr']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/merchants/{id}/mrr',
            path: { id: id },
            ...options,
        });
    }
}
