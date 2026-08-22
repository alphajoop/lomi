/* @proprietary license */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTryItOperation, resolvePathTemplate } from './operation-tryit';

test('builds a sandbox Try-it operation from OpenAPI JSON', () => {
  const operation = getTryItOperation(
    {
      paths: {
        '/checkout-sessions': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  example: { product_id: 'prod_1' },
                },
              },
            },
          },
        },
      },
    },
    'POST',
    '/checkout-sessions',
  );
  assert.ok(operation);
  assert.equal(operation.method, 'post');
  assert.equal(operation.hasBody, true);
  assert.equal(operation.sandboxOrigin, 'https://sandbox.api.lomi.africa');
  assert.match(operation.exampleBody ?? '', /prod_1/);
});

test('resolves path templates without leaving the sandbox origin', () => {
  assert.equal(
    resolvePathTemplate('/customers/{id}', { id: 'cus_1' }),
    '/customers/cus_1',
  );
  const operation = getTryItOperation(
    {
      paths: {
        '/customers/{id}': {
          get: {},
        },
      },
    },
    'get',
    '/customers/{id}',
  );
  assert.ok(operation);
  assert.deepEqual(operation.pathParams, ['id']);
  assert.equal(operation.hasBody, false);
});
