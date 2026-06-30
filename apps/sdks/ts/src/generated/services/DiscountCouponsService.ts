/**
 * DiscountCouponsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class DiscountCouponsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Create discount coupon
     * @see OpenAPI `DiscountCouponsController_create`
     */
    public async create(options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['DiscountCouponResponseDto']> {
        return requestWithClient<components['schemas']['DiscountCouponResponseDto']>(this.client, {
            method: 'POST',
            url: '/discount-coupons',
            ...options,
        });
    }

    /**
     * Retrieve discount coupon
     * @see OpenAPI `DiscountCouponsController_findOne`
     */
    public async get(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['DiscountCouponResponseDto']> {
        return requestWithClient<components['schemas']['DiscountCouponResponseDto']>(this.client, {
            method: 'GET',
            url: '/discount-coupons/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * Coupon performance metrics
     * @see OpenAPI `DiscountCouponsController_getPerformance`
     */
    public async getPerformance(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/discount-coupons/{id}/performance']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/discount-coupons/{id}/performance']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/discount-coupons/{id}/performance',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List discount coupons
     * @see OpenAPI `DiscountCouponsController_findAll`
     */
    public async list(options?: import("../../request-options.js").LomiRequestOptions): Promise<(NonNullable<NonNullable<paths['/discount-coupons']['get']['responses'][200]>['content']>['application/json'])> {
        return requestWithClient<(NonNullable<NonNullable<paths['/discount-coupons']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
            method: 'GET',
            url: '/discount-coupons',
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
            const response = await requestWithClient<(NonNullable<NonNullable<paths['/discount-coupons']['get']['responses'][200]>['content']>['application/json'])>(this.client, {
                method: 'GET',
                url: '/discount-coupons',
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
