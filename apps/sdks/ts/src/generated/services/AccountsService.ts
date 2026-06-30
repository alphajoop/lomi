/**
 * AccountsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class AccountsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Check available balance
     * @see OpenAPI `AccountsController_checkAvailableBalance`
     */
    public async checkBalance(currency: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/accounts/balance/check/{currency}']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/accounts/balance/check/{currency}']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/accounts/balance/check/{currency}',
            path: { currency: currency },
            ...options,
        });
    }

    /**
     * Account balances
     * @see OpenAPI `AccountsController_getBalance`
     */
    public async getBalance(params?: paths['/accounts/balance']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/accounts/balance']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/accounts/balance']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/accounts/balance',
            query: params,
            ...options,
        });
    }

    /**
     * Balance breakdown
     * @see OpenAPI `AccountsController_getBalanceBreakdown`
     */
    public async getBalanceBreakdown(params?: paths['/accounts/balance/breakdown']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/accounts/balance/breakdown']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/accounts/balance/breakdown']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/accounts/balance/breakdown',
            query: params,
            ...options,
        });
    }
}
