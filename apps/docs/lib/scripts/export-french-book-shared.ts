/* @proprietary license */

/**
 * Shared Markdown → HTML → PDF helpers for French regulatory book exports.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export type BookSection = {
  title: string;
  files: string[];
  /** Inline markdown blocks (no source file), rendered after file pages. */
  inlinePages?: Array<{ title: string; body: string }>;
};

export function stripFrontmatter(source: string): {
  title?: string;
  body: string;
} {
  if (!source.startsWith('---')) {
    return { body: source.trim() };
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    return { body: source.trim() };
  }
  const frontmatter = source.slice(3, end).trim();
  const titleMatch = frontmatter.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  const body = source.slice(end + 4).trim();
  return { title: titleMatch?.[1], body };
}

export function sanitizeMdxForPrint(body: string): string {
  return body
    .split('\n')
    .filter((line) => !line.trim().startsWith('import '))
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '$1 ($2)')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let h1Count = 0;
  let paragraph: string[] = [];

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').trim();
    if (text) html.push(`<p>${inlineFormat(text)}</p>`);
    paragraph = [];
  };

  const inlineFormat = (text: string): string => {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
    return out;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.startsWith('```')) {
      flushParagraph();
      closeLists();
      if (inTable) {
        html.push('</table>');
        inTable = false;
      }
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph();
      closeLists();
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());
      if (/^\|?\s*:?-{3,}/.test(line.trim())) {
        continue;
      }
      if (!inTable) {
        html.push('<table>');
        html.push(
          `<thead><tr>${cells.map((c) => `<th>${inlineFormat(c)}</th>`).join('')}</tr></thead><tbody>`,
        );
        inTable = true;
      } else {
        html.push(
          `<tr>${cells.map((c) => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`,
        );
      }
      continue;
    }

    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }

    if (line.trim() === '') {
      flushParagraph();
      closeLists();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeLists();
      const level = heading[1].length;
      if (level === 1) {
        h1Count += 1;
        const sectionClass = h1Count > 1 ? ' class="section-title"' : '';
        html.push(`<h1${sectionClass}>${inlineFormat(heading[2])}</h1>`);
      } else {
        html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      }
      continue;
    }

    if (line.trim() === '---') {
      flushParagraph();
      closeLists();
      html.push('<hr />');
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    if (ul) {
      flushParagraph();
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushParagraph();
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    if (line.trim().startsWith('>')) {
      flushParagraph();
      closeLists();
      html.push(
        `<blockquote><p>${inlineFormat(line.replace(/^\s*>\s?/, ''))}</p></blockquote>`,
      );
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeLists();
  if (inTable) html.push('</tbody></table>');
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

export function wrapHtmlDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 18mm 14mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #111;
      orphans: 3;
      widows: 3;
    }
    h1, h2, h3, h4 {
      break-after: avoid;
      page-break-after: avoid;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    h1 {
      font-size: 18pt;
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd;
    }
    h1.section-title {
      break-before: page;
      page-break-before: always;
      margin-top: 0;
    }
    h2 {
      font-size: 13pt;
      margin: 22px 0 8px;
    }
    h3 { font-size: 11pt; margin: 16px 0 6px; }
    h4 { font-size: 10pt; margin: 12px 0 4px; }
    p, li {
      margin: 0 0 8px;
    }
    ul, ol {
      margin: 0 0 10px;
      padding-left: 1.35em;
    }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
    }
    code {
      background: #f4f4f4;
      padding: 0.1em 0.3em;
      border-radius: 2px;
    }
    pre {
      background: #f6f6f6;
      border: 1px solid #e5e5e5;
      padding: 8px 10px;
      margin: 0 0 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0 12px;
      font-size: 8pt;
      break-inside: auto;
      page-break-inside: auto;
    }
    thead { display: table-header-group; }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f3f3f3; }
    blockquote {
      border-left: 3px solid #bbb;
      margin: 0 0 10px;
      padding: 2px 0 2px 10px;
      color: #333;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e5e5;
      margin: 16px 0;
    }
    a { color: inherit; text-decoration: none; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

export function renderBook(options: {
  title: string;
  sections: BookSection[];
}): string {
  const { title, sections } = options;
  const lines: string[] = [`# ${title}`, '', '## Table des matières', ''];

  for (const section of sections) {
    lines.push(`- **${section.title}**`);
    for (const file of section.files) {
      const { title: pageTitle } = stripFrontmatter(readFileSync(file, 'utf-8'));
      const slug = basename(file).replace(/\.fr\.mdx$/i, '');
      lines.push(`  - ${pageTitle ?? slug}`);
    }
    for (const page of section.inlinePages ?? []) {
      lines.push(`  - ${page.title}`);
    }
    lines.push('');
  }

  for (const section of sections) {
    lines.push('', `# ${section.title}`, '');
    for (const file of section.files) {
      const raw = readFileSync(file, 'utf-8');
      const { title: pageTitle, body } = stripFrontmatter(raw);
      lines.push(
        `## ${pageTitle ?? basename(file).replace(/\.fr\.mdx$/i, '')}`,
        '',
      );
      lines.push(sanitizeMdxForPrint(body), '');
    }
    for (const page of section.inlinePages ?? []) {
      lines.push(`## ${page.title}`, '', page.body.trim(), '');
    }
  }

  return `${lines.join('\n').trim()}\n`;
}

function findChrome(): string | null {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

export function exportPdfFromHtml(htmlPath: string, pdfPath: string): void {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error(
      'No Chrome/Chromium/Edge found for PDF export. HTML was still written.',
    );
  }
  const fileUrl = `file://${resolve(htmlPath)}`;
  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${resolve(pdfPath)}`,
      fileUrl,
    ],
    { encoding: 'utf-8' },
  );
  if (result.status !== 0 || !existsSync(pdfPath)) {
    throw new Error(
      `Chrome PDF export failed (status ${result.status}): ${result.stderr || result.stdout}`,
    );
  }
}

export function writeBookArtifacts(options: {
  outPath: string;
  title: string;
  markdown: string;
  pdf: boolean;
}): void {
  const { outPath, title, markdown, pdf } = options;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, 'utf-8');

  const htmlPath = outPath.replace(/\.md$/i, '.html');
  writeFileSync(
    htmlPath,
    wrapHtmlDocument(title, markdownToHtml(markdown)),
    'utf-8',
  );

  console.log(`Wrote ${outPath}`);
  console.log(`Wrote ${htmlPath}`);

  if (pdf) {
    const pdfPath = outPath.replace(/\.md$/i, '.pdf');
    exportPdfFromHtml(htmlPath, pdfPath);
    console.log(`Wrote ${pdfPath}`);
  }
}

export function existingFiles(paths: string[]): string[] {
  return paths.filter((path) => existsSync(path));
}
