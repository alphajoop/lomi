/**
 * UsageEventsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class UsageEventsService {
    /**
     * OpenAPI operationId: `UsageEventsController_ingest`.
     * Record a usage event
     */
    public static async create(): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/usage-events',
        });
    }

    /**
     * OpenAPI operationId: `UsageEventsController_findOne`.
     * Get a usage event
     */
    public static async get(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-events/{id}',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `UsageEventsController_findAll`.
     * List usage events
     */
    public static async list(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/usage-events',
            query: options,
        });
    }
}
