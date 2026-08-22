/* @proprietary license */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  remainingOnboardingSteps,
  shouldShowOnboardingChecklist,
} from './docs-onboarding';

test('hides the checklist until client state is ready', () => {
  assert.equal(
    shouldShowOnboardingChecklist({
      ready: false,
      dismissed: false,
      remainingSteps: 3,
    }),
    false,
  );
});

test('hides the checklist after dismissal', () => {
  assert.equal(
    shouldShowOnboardingChecklist({
      ready: true,
      dismissed: true,
      remainingSteps: 2,
    }),
    false,
  );
});

test('hides the checklist when every step is done', () => {
  assert.equal(
    remainingOnboardingSteps({
      signedIn: true,
      organizationCount: 1,
      firstPayment: true,
    }),
    0,
  );
  assert.equal(
    shouldShowOnboardingChecklist({
      ready: true,
      dismissed: false,
      remainingSteps: 0,
    }),
    false,
  );
});

test('counts remaining account, keys, and payment steps', () => {
  assert.equal(
    remainingOnboardingSteps({
      signedIn: false,
      organizationCount: 0,
      firstPayment: false,
    }),
    3,
  );
  assert.equal(
    remainingOnboardingSteps({
      signedIn: true,
      organizationCount: 0,
      firstPayment: false,
    }),
    2,
  );
  assert.equal(
    remainingOnboardingSteps({
      signedIn: true,
      organizationCount: 2,
      firstPayment: false,
    }),
    1,
  );
});
