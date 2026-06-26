/**
 * ChargesService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class ChargesService {
    /**
     * OpenAPI operationId: `ChargesController_cancelCardCharge`.
     * Cancel card charge
     */
    public static async cancelCardCharge(id: string): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/charge/card/{id}/cancel',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `ChargesController_createCardCharge`.
     * Create card charge (client_secret)
     */
    public static async createCardCharge(body?: unknown): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/charge/card',
            body,
        });
    }

    /**
     * OpenAPI operationId: `ChargesController_createMtnCharge`.
     * Create MTN MoMo charge
     */
    public static async createMtnCharge(body?: unknown): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/charge/mtn',
            body,
        });
    }

    /**
     * OpenAPI operationId: `ChargesController_createWaveCharge`.
     * Create direct Wave charge
     */
    public static async createWaveCharge(body?: unknown): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/charge/wave',
            body,
        });
    }

    /**
     * OpenAPI operationId: `ChargesController_getCardCharge`.
     * Retrieve card charge
     */
    public static async getCardCharge(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/charge/card/{id}',
            path: { id: id },
        });
    }
}
