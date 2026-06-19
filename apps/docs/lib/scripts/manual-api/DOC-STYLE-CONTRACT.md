# lomi. API documentation: style contract

This file defines how **generated REST operation pages** (`render-operation-mdx.ts` + `en-operation-overrides.ts`) and **hand-authored guides** should read. Goal: Polar-like clarity, decisive, scannable, and operationally honest.

## Voice

- **Direct and confident.** Prefer “Returns…” / “Creates…” over “This endpoint allows you to…”.
- **Merchant-centric.** State what the integrator can rely on (status codes, idempotency, side effects).
- **Present tense**, active voice when describing the API.

## Structure (generated operation pages)

1. **Overview**: One-line summary (`summary`) plus short body. Optional subheadings:
   - **When to use this**: The job-to-be-done or trigger (checkout vs charge vs link, etc.).
   - **Good to know**: Async behavior, retries, provider quirks, or compliance notes.
   - **See also**: 1–2 deep links to related REST pages or guides (same tone, no filler).
2. **Authentication**: Standard `X-API-KEY` / sandbox vs live (template).
3. **Endpoint**: Method + path + base URLs.
4. **Request / Responses / Errors**: Tables and examples stay schema-accurate; prose does not duplicate every field.
5. **Example**: Minimal `curl` against sandbox.
6. **OpenAPI**: Pointers to Try it + `openapi.json`.

## Microcopy rules

- **Titles**: Use imperative or noun phrases: “Create checkout session”, “List transactions”, “Retrieve customer”.
- **404**: Say “Responds with **404** when the resource is unknown or outside this API key’s scope” (consistent phrasing).
- **Amounts**: When relevant, mention currency/minor units if the product uses them; cross-link to pricing or amounts docs if needed.
- **No vague adjectives**: Avoid “robust”, “powerful”, “seamless” unless paired with a concrete behavior.
- **bilingual**: English overrides are canonical for generated `*.mdx`. French `*.fr.mdx` follows OpenAPI; keep FR summaries translated in the API source over time.

## LLM-oriented exports

- **`/llms.txt`**: Curated operator briefing: auth, environments, workflows, and pointers, **not** a flat dump of every page.
- **`/llms-full.txt`**: Concatenated page text; quality comes from **good MDX source**, not from post-processing alone.
- **`get-llm-text.ts`**: Each block should start with a stable title line and a canonical `Source:` URL on the deployed docs site.

## Maintenance

- Every public **merchant** `operationId` in `apps/docs/openapi.json` must have an entry in `EN_OPERATION_COPY` (verified by `pnpm exec tsx lib/scripts/manual-api/verify-en-operation-overrides.ts`).
- After OpenAPI changes, run `pnpm run api:regenerate-rest-reference` with `CONFIRM_BOOTSTRAP=1` to scaffold missing pages; add `BOOTSTRAP_OVERWRITE=1` only when you intentionally want to replace existing pages. Re-edit overrides if new operations appear.
