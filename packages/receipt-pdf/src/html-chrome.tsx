import type { ReactNode } from "react";
import {
  PDF_DOCS_URL,
  PDF_LEARN_MORE_LABEL,
  PDF_LEGAL_LINE_1,
  PDF_PAY_LINK_LABEL,
  PDF_PAY_ONLINE_LABEL,
  PDF_REGISTERED_OFFICE,
  contactLineSuffix,
  type PdfDocumentKind,
} from "./legal";
import { LOMI_WORDMARK_SRC } from "./wordmark";

export function HtmlDocumentBand({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 right-0 h-2"
      style={{ backgroundColor: color }}
    />
  );
}

export function HtmlWordmark({ className }: { className?: string }) {
  return (
    <img
      src={LOMI_WORDMARK_SRC}
      alt="lomi."
      width={56}
      height={21}
      className={className ?? "h-[21px] w-[56px] shrink-0 object-contain"}
    />
  );
}

export function HtmlMetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <p className="text-[11px] text-[#878787] leading-[18px]">
      <span className="font-semibold">{label} </span>
      <span className="font-normal text-foreground">{value}</span>
    </p>
  );
}

export function HtmlDocumentHeader({
  title,
  children,
  logoSrc,
}: {
  title: ReactNode;
  children?: ReactNode;
  logoSrc?: string | null;
}) {
  return (
    <div className="flex justify-between items-start gap-4 mb-6">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-[21px] font-semibold leading-6 mb-2">{title}</div>
        <div className="flex flex-col gap-0.5">{children}</div>
      </div>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt=""
          width={56}
          height={21}
          className="h-[21px] w-[56px] shrink-0 object-contain"
        />
      ) : (
        <HtmlWordmark />
      )}
    </div>
  );
}

export function HtmlSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-[#878787] uppercase tracking-[0.4px] mb-1">
      {children}
    </p>
  );
}

export function HtmlPayOnlineRow({ url }: { url: string }) {
  return (
    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#E2E8F0]">
      <span className="text-[11px] text-[#878787]">{PDF_PAY_ONLINE_LABEL}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold text-[#4568FF] no-underline"
      >
        {PDF_PAY_LINK_LABEL}
      </a>
    </div>
  );
}

export function HtmlContactLine({
  email,
  kind,
}: {
  email: string;
  kind: PdfDocumentKind;
}) {
  return (
    <p className="text-[10px] leading-[1.4] text-[#6B7280] text-right mt-2.5">
      Please contact{" "}
      <a href={`mailto:${email}`} className="text-[#6B7280] no-underline">
        {email}
      </a>
      {contactLineSuffix(kind)}
    </p>
  );
}

export function HtmlLegalFooter() {
  return (
    <div className="mt-8 pt-2 border-t border-[#E2E8F0]">
      <p className="text-[10px] leading-[1.45] text-[#878787] mb-0.5">
        {PDF_LEGAL_LINE_1}
      </p>
      <p className="text-[10px] leading-[1.45] text-[#878787]">
        {PDF_REGISTERED_OFFICE}.{"  "}
        <a
          href={PDF_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#878787] no-underline"
        >
          {PDF_LEARN_MORE_LABEL}
        </a>
        .
      </p>
    </div>
  );
}
