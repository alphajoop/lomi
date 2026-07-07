/**
 * BullMQ rejects custom job IDs that contain ':', it is the Redis key
 * separator, so `Job.validateOptions` throws "Custom Id cannot contain :" and
 * the `queue.add()` call fails. All of our dedup keys are namespaced with ':'
 * (e.g. `wh-dispatch:<uuid>`, `usage:<org>:<tx>`, `billing-cycle:<date>`),
 * which silently broke every queue once BullMQ tightened this validation.
 *
 * Normalizing ':' to '_' keeps the dedup/idempotency semantics (same input →
 * same id) while staying within BullMQ's allowed character set.
 */
export function safeBullJobId(rawId: string): string {
  return rawId.replace(/:/g, '_');
}
