export const PDF_LEGAL_ENTITY = "lomi. Technologies Africa S.A";
export const PDF_LEGAL_FORM = "an Ivoirian limited company";
export const PDF_SHARE_CAPITAL = "100 000 000 F CFA";
export const PDF_RCCM = "CI-ABJ-03-2024-B12-07612";
export const PDF_REGISTERED_OFFICE = "Cocody, Les Perles, Rue L82/375, Abidjan";
export const PDF_DOCS_URL = "https://docs.lomi.africa";
export const PDF_LEARN_MORE_LABEL = "Learn more about our billing products";
export const PDF_SUPPORT_EMAIL_FALLBACK = "support@lomi.africa";
export const PDF_PAY_ONLINE_LABEL = "Pay online";
export const PDF_PAY_LINK_LABEL = "Link";

export const PDF_LEGAL_LINE_1 = `${PDF_LEGAL_ENTITY} is ${PDF_LEGAL_FORM} of share capital ${PDF_SHARE_CAPITAL}. Registered number: ${PDF_RCCM}. Registered office:`;

export type PdfDocumentKind = "invoice" | "receipt";

export function extractEmailFromText(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

export function resolveSupportEmail(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && trimmed.includes("@")) return trimmed;
  }
  return PDF_SUPPORT_EMAIL_FALLBACK;
}

export function contactLineSuffix(kind: PdfDocumentKind): string {
  return ` with any questions regarding this ${kind}.`;
}
