import { pdf } from "@react-pdf/renderer";
import { ReceiptPdfDocument } from "./receipt-pdf-document";
import type { ReceiptDocumentData } from "./types";

export async function renderReceiptPdfBlob(
  data: ReceiptDocumentData,
): Promise<Blob> {
  return pdf(<ReceiptPdfDocument data={data} />).toBlob();
}

export async function downloadReceiptPdf(
  data: ReceiptDocumentData,
  filename?: string,
): Promise<void> {
  const blob = await renderReceiptPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `receipt_${data.transactionId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
