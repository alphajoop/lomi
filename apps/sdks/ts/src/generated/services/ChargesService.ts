/**
 * ChargesService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class ChargesService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Cancel embedded card charge
     * @see OpenAPI `ChargesController_cancelCardCharge`
     */
    public async cancelCardCharge(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'POST',
            url: '/charge/card/{id}/cancel',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Create embedded card charge
     * @see OpenAPI `ChargesController_createCardCharge`
     */
    public async createCardCharge(body: NonNullable<paths['/charge/card']['post']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/charge/card']['post']['responses'][201]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/charge/card']['post']['responses'][201]>['content']>['application/json']>>(this.client, {
            method: 'POST',
            url: '/charge/card',
            body,
            ...options,
        });
    }

    /**
     * Create MTN MoMo charge
     * @see OpenAPI `ChargesController_createMtnCharge`
     */
    public async createMtnCharge(body: NonNullable<paths['/charge/mtn']['post']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/charge/mtn']['post']['responses'][201]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/charge/mtn']['post']['responses'][201]>['content']>['application/json']>>(this.client, {
            method: 'POST',
            url: '/charge/mtn',
            body,
            ...options,
        });
    }

    /**
     * Create Switch charge
     * @see OpenAPI `ChargesController_createSwitchCharge`
     */
    public async createSwitchCharge(body: NonNullable<paths['/charge/switch']['post']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/charge/switch']['post']['responses'][201]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/charge/switch']['post']['responses'][201]>['content']>['application/json']>>(this.client, {
            method: 'POST',
            url: '/charge/switch',
            body,
            ...options,
        });
    }

    /**
     * Create direct mobile-money charge
     * @see OpenAPI `ChargesController_createWaveCharge`
     */
    public async createWaveCharge(body: NonNullable<paths['/charge/wave']['post']['requestBody']>['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/charge/wave']['post']['responses'][201]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/charge/wave']['post']['responses'][201]>['content']>['application/json']>>(this.client, {
            method: 'POST',
            url: '/charge/wave',
            body,
            ...options,
        });
    }

    /**
     * Get embedded card charge
     * @see OpenAPI `ChargesController_getCardCharge`
     */
    public async getCardCharge(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<NonNullable<NonNullable<paths['/charge/card/{id}']['get']['responses'][200]>['content']>['application/json']>> {
        return requestWithClient<NonNullable<NonNullable<paths['/charge/card/{id}']['get']['responses'][200]>['content']>['application/json']>>(this.client, {
            method: 'GET',
            url: '/charge/card/{id}',
            path: { id: id },
            ...options,
        });
    }
}
