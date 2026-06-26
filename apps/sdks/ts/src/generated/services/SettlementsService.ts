/**
 * SettlementsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class SettlementsService {
    /**
     * OpenAPI operationId: `SettlementsController_findAll`.
     * List settlement periods
     */
    public static async findAll(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/settlements',
            query: options,
        });
    }

    /**
     * OpenAPI operationId: `SettlementsController_findTransactions`.
     * List transactions in a settlement period
     */
    public static async findTransactions(id: string, options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/settlements/{id}/transactions',
            path: { id: id },
            query: options,
        });
    }
}
