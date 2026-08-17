export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";

  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<\/p>/gi, " ");

  return withLineBreaks
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};
