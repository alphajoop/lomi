/**
 * RiskAssessmentsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class RiskAssessmentsService {
    /**
     * OpenAPI operationId: `RadarController_findOne`.
     * Get a risk assessment
     */
    public static async findOne(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/risk-assessments/{id}',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `RadarController_listAssessments`.
     * List payment risk assessments
     */
    public static async listAssessments(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/risk-assessments',
            query: options,
        });
    }
}
