/**
 * OrganizationService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class OrganizationService {
    /**
     * OpenAPI operationId: `RadarController_getSettings`.
     * Get Radar settings for the organization
     */
    public static async getSettings(): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/organization/radar-settings',
        });
    }

    /**
     * OpenAPI operationId: `RadarController_updateSettings`.
     * Update Radar settings
     */
    public static async updateSettings(body?: unknown): Promise<any> {
        return await request<any>({
            method: 'PATCH',
            url: '/organization/radar-settings',
            body,
        });
    }
}
