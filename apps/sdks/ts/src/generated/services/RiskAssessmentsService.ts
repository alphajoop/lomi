/**
 * RiskAssessmentsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class RiskAssessmentsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Get risk assessment
     * @see OpenAPI `RadarController_findOne`
     */
    public async findOne(id: string, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/risk-assessments/{id}',
            path: { id: id },
            ...options,
        });
    }

    /**
     * List risk assessments
     * @see OpenAPI `RadarController_listAssessments`
     */
    public async listAssessments(params?: paths['/risk-assessments']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<unknown> {
        return requestWithClient<unknown>(this.client, {
            method: 'GET',
            url: '/risk-assessments',
            query: params,
            ...options,
        });
    }
}
