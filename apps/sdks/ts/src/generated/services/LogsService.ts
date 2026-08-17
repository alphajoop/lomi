/**
 * LogsService
 * AUTO-GENERATED — public merchant surface from filtered OpenAPI
 */

import type { LomiClient } from '../../client.js';
import { requestWithClient } from '../../http.js';
import type { paths, components } from '../schema.js';

export class LogsService {
    constructor(private readonly client: LomiClient) {}

    /**
     * Retrieve log entry
     * @see OpenAPI `LogsController_findOne`
     */
    public async get(id: string, params?: paths['/logs/{id}']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['LogEntryResponseDto']> {
        return requestWithClient<components['schemas']['LogEntryResponseDto']>(this.client, {
            method: 'GET',
            url: '/logs/{id}',
            path: { id: id },
            query: params,
            ...options,
        });
    }

    /**
     * List logs
     * @see OpenAPI `LogsController_findAll`
     */
    public async list(params?: paths['/logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>, options?: import("../../request-options.js").LomiRequestOptions): Promise<components['schemas']['LogListResponseDto']> {
        return requestWithClient<components['schemas']['LogListResponseDto']>(this.client, {
            method: 'GET',
            url: '/logs',
            query: params,
            ...options,
        });
    }

    /**
     * Auto-paginate all pages from `list`.
     */
    public async *listAll(
        params?: paths['/logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
        options?: import("../../request-options.js").LomiRequestOptions,
    ): AsyncGenerator<unknown, void, undefined> {
        let page = (params as { page?: number } | undefined)?.page ?? 1;
        const pageSize = (params as { pageSize?: number } | undefined)?.pageSize ?? 50;

        while (true) {
            const response = await this.list(
                { ...params, page, pageSize } as paths['/logs']['get']['parameters'] extends { query: infer Q } ? Q : Record<string, unknown>,
                options,
            );

            const items =
                (response as { data?: unknown[] })?.data ??
                (response as { items?: unknown[] })?.items;

            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            for (const item of items) {
                yield item;
            }

            if (items.length < pageSize) {
                break;
            }

            page += 1;
        }
    }
}
