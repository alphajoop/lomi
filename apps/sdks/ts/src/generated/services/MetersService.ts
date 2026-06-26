/**
 * MetersService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class MetersService {
    /**
     * OpenAPI operationId: `MetersController_create`.
     * Create a meter
     */
    public static async create(): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/meters',
        });
    }

    /**
     * OpenAPI operationId: `MetersController_findOne`.
     * Get a meter
     */
    public static async get(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/meters/{id}',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `MetersController_getBalance`.
     * Get meter balance for a customer
     */
    public static async getCustomerBalance(id: string, customerId: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/meters/{id}/balances/{customerId}',
            path: { id: id, customerId: customerId },
        });
    }

    /**
     * OpenAPI operationId: `MetersController_findAll`.
     * List meters
     */
    public static async list(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/meters',
            query: options,
        });
    }

    /**
     * OpenAPI operationId: `MetersController_update`.
     * Update a meter
     */
    public static async update(id: string): Promise<any> {
        return await request<any>({
            method: 'PATCH',
            url: '/meters/{id}',
            path: { id: id },
        });
    }
}
