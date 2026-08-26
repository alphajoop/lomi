import { Image, Link, Text, View } from "@react-pdf/renderer";
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
import {
  PDF_BACKGROUND,
  PDF_BAND_HEIGHT,
  PDF_FONT_SIZE,
  PDF_LABEL_COLOR,
  PDF_LINK,
  PDF_MUTED_BORDER,
  PDF_MUTED_TEXT,
  PDF_PAGE_PADDING,
  PDF_TEXT_COLOR,
} from "./tokens";
import { LOMI_WORDMARK_SRC } from "./wordmark";

export const PDF_PAGE_CHROME_STYLE = {
  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: PDF_FONT_SIZE.body,
  color: PDF_TEXT_COLOR,
  backgroundColor: PDF_BACKGROUND,
  paddingTop: 36,
  paddingHorizontal: PDF_PAGE_PADDING,
  paddingBottom: 72,
} as const;

export function PdfTopBand({ color }: { color: string }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: PDF_BAND_HEIGHT,
        backgroundColor: color,
      }}
    />
  );
}

export function PdfWordmark() {
  return <Image src={LOMI_WORDMARK_SRC} style={{ width: 56, height: 21 }} />;
}

export function PdfMetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Text
      style={{
        fontSize: PDF_FONT_SIZE.label,
        color: PDF_LABEL_COLOR,
        marginBottom: 3,
      }}
    >
      <Text style={{ fontWeight: 600 }}>{label} </Text>
      {value}
    </Text>
  );
}

export function PdfDocumentHeader({
  title,
  meta,
}: {
  title: string;
  meta?: Array<{ label: string; value: string }>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 22,
      }}
    >
      <View style={{ flex: 1, paddingRight: 16, minWidth: 0 }}>
        <Text
          style={{
            fontSize: PDF_FONT_SIZE.title,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        {meta?.map((row) => (
          <PdfMetaRow key={row.label} label={row.label} value={row.value} />
        ))}
      </View>
      <PdfWordmark />
    </View>
  );
}

export function PdfSectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: PDF_FONT_SIZE.label,
        fontWeight: 500,
        color: PDF_LABEL_COLOR,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {children}
    </Text>
  );
}

export function PdfPayOnlineRow({ url }: { url: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: PDF_MUTED_BORDER,
      }}
    >
      <Text style={{ fontSize: PDF_FONT_SIZE.label, color: PDF_LABEL_COLOR }}>
        {PDF_PAY_ONLINE_LABEL}
      </Text>
      <Link
        src={url}
        style={{
          fontSize: PDF_FONT_SIZE.label,
          fontWeight: 600,
          color: PDF_LINK,
          textDecoration: "none",
        }}
      >
        {PDF_PAY_LINK_LABEL}
      </Link>
    </View>
  );
}

export function PdfContactLine({
  email,
  kind,
}: {
  email: string;
  kind: PdfDocumentKind;
}) {
  return (
    <Text
      style={{
        fontSize: PDF_FONT_SIZE.footer,
        color: PDF_MUTED_TEXT,
        lineHeight: 1.4,
        marginTop: 10,
        textAlign: "right",
      }}
    >
      Please contact{" "}
      <Link
        src={`mailto:${email}`}
        style={{ color: PDF_MUTED_TEXT, textDecoration: "none" }}
      >
        {email}
      </Link>
      {contactLineSuffix(kind)}
    </Text>
  );
}

export function PdfLegalFooter() {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 16,
        left: PDF_PAGE_PADDING,
        right: PDF_PAGE_PADDING,
      }}
    >
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: PDF_MUTED_BORDER,
          paddingTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: PDF_FONT_SIZE.footer,
            color: PDF_LABEL_COLOR,
            lineHeight: 1.45,
            marginBottom: 2,
          }}
        >
          {PDF_LEGAL_LINE_1}
        </Text>
        <Text
          style={{
            fontSize: PDF_FONT_SIZE.footer,
            color: PDF_LABEL_COLOR,
            lineHeight: 1.45,
          }}
        >
          {PDF_REGISTERED_OFFICE}.{"  "}
          <Link
            src={PDF_DOCS_URL}
            style={{ color: PDF_LABEL_COLOR, textDecoration: "none" }}
          >
            {PDF_LEARN_MORE_LABEL}
          </Link>
          .
        </Text>
      </View>
    </View>
  );
}
