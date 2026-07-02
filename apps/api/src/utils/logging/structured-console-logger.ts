/** JSON console lines for Railway/Vercel search by request_id (not exposed via GET /logs). */

export type StructuredLogFields = {
  event: string;
  message?: string;
  request_id?: string;
  organization_id?: string;
  merchant_id?: string;
  [key: string]: unknown;
};

export function logStructured(fields: StructuredLogFields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...fields,
  });
  if (fields.event.includes('_failed') || fields.event.includes('_error')) {
    console.error(line);
  } else {
    console.log(line);
  }
}
