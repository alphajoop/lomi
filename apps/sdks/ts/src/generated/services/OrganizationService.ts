/**
 * OrganizationService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths } from '../schema.js';

export class OrganizationService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Get Radar settings
     * @see OpenAPI `RadarController_getSettings`
     */
    public async getSettings(options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/organization/radar-settings',
            ...options,
        });
    }

    /**
     * Update Radar settings
     * @see OpenAPI `RadarController_updateSettings`
     */
    public async updateSettings(body: paths['/organization/radar-settings']['patch']['requestBody']['content']['application/json'], options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'PATCH',
            url: '/organization/radar-settings',
            body,
            ...options,
        });
    }
}
