/**
 * DisputesService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class DisputesService {
    /**
     * OpenAPI operationId: `DisputesController_findOne`.
     * Obtenir un litige
     */
    public static async get(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/disputes/{id}',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `DisputesController_findAll`.
     * Lister les litiges
     */
    public static async list(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/disputes',
            query: options,
        });
    }
}
