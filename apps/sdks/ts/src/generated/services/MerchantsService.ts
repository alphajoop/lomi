/**
 * MerchantsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class MerchantsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Get merchant details
     * @see OpenAPI `MerchantsController_getDetails`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['MerchantResponseDto']> {
        return requestWithClient<components['schemas']['MerchantResponseDto']>(this.client, {
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
    public async getArr(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['MerchantArrResponseDto']> {
        return requestWithClient<components['schemas']['MerchantArrResponseDto']>(this.client, {
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
    public async getBalance(id: string, params?: paths['/merchants/{id}/balance']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['MerchantBalanceResponseDto']> {
        return requestWithClient<components['schemas']['MerchantBalanceResponseDto']>(this.client, {
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
    public async getMrr(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['MerchantMrrResponseDto']> {
        return requestWithClient<components['schemas']['MerchantMrrResponseDto']>(this.client, {
            method: 'GET',
            url: '/merchants/{id}/mrr',
            path: { id: id },
            ...options,
        });
    }
}
