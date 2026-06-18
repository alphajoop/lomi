/**
 * SubscriptionsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import { request } from '../core/request.js';

export class SubscriptionsService {
    /**
     * OpenAPI operationId: `SubscriptionsController_cancel`.
     * Résilier un abonnement
     */
    public static async cancel(id: string, body?: unknown): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/subscriptions/{id}/cancel',
            path: { id: id },
            body,
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_changePlan`.
     * Changer le plan tarifaire
     */
    public static async changePlan(id: string, body?: unknown): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/subscriptions/{id}/change-plan',
            path: { id: id },
            body,
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_findByCustomer`.
     * Abonnements d’un client
     */
    public static async findByCustomer(customerId: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/subscriptions/customer/{customerId}',
            path: { customerId: customerId },
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_findOne`.
     * Obtenir un abonnement par ID
     */
    public static async get(id: string): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/subscriptions/{id}',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_findAll`.
     * Lister les abonnements
     */
    public static async list(options?: Record<string, unknown>): Promise<any> {
        return await request<any>({
            method: 'GET',
            url: '/subscriptions',
            query: options,
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_uncancel`.
     * Annuler une résiliation planifiée
     */
    public static async uncancel(id: string): Promise<any> {
        return await request<any>({
            method: 'POST',
            url: '/subscriptions/{id}/uncancel',
            path: { id: id },
        });
    }

    /**
     * OpenAPI operationId: `SubscriptionsController_update`.
     * Mettre à jour un abonnement
     */
    public static async update(id: string): Promise<any> {
        return await request<any>({
            method: 'PATCH',
            url: '/subscriptions/{id}',
            path: { id: id },
        });
    }
}
