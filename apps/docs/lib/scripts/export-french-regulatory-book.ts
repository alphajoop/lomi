/* @proprietary license */

/**
 * Concatenate French regulatory documentation into Markdown, HTML, and optional PDF.
 *
 * Default scope (BCEAO / audit friendly):
 * - API conceptual pages (auth, errors, data models, payment state machine)
 * - API reference overview + all public REST operation pages in sidebar order
 * - Organization radar settings pages
 * - Advanced integration guides (webhooks, idempotency, security, errors)
 *
 * Excludes onboarding fluff: Start, UI, ecommerce plugins, contributing, open-source.
 *
 * Run from apps/docs:
 *   pnpm docs:export-fr-book
 *   pnpm docs:export-fr-book -- --out ../../docs/compliance/exports/lomi-reference-api-fr.md
 *   pnpm docs:export-fr-book -- --pdf
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { REST_API_SECTION_ORDER } from '@/lib/scripts/manual-api/constants';

const DOCS_ROOT = join(process.cwd(), 'content/docs');
const DEFAULT_OUT_DIR = join(
  process.cwd(),
  '../../docs/compliance/exports',
);
const DEFAULT_OUT = join(DEFAULT_OUT_DIR, 'lomi-reference-api-fr.md');

const API_CONCEPT_PAGES = [
  'authentication.fr.mdx',
  'errors.fr.mdx',
  'data-models.fr.mdx',
  'payment-state-machine.fr.mdx',
] as const;

const EXTRA_API_SECTIONS = ['organization'] as const;

const ADVANCED_GUIDE_ORDER = [
  'index.fr.mdx',
  'handling-webhooks.fr.mdx',
  'webhook-reliability.fr.mdx',
  'idempotency-keys.fr.mdx',
  'error-handling.fr.mdx',
  'security-best-practices.fr.mdx',
  'testing.fr.mdx',
  'ci-cd.fr.mdx',
] as const;

type BookSection = {
  title: string;
  files: string[];
};

type CliOptions = {
  outPath: string;
  pdf: boolean;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outPath =
    outIdx === -1
      ? DEFAULT_OUT
      : (() => {
          const value = args[outIdx + 1];
          if (!value) throw new Error('Missing path after --out');
          return value;
        })();
  return { outPath, pdf: args.includes('--pdf') };
}

function stripFrontmatter(source: string): { title?: string; body: string } {
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

function sanitizeMdxForPrint(body: string): string {
  return body
    .split('\n')
    .filter((line) => !line.trim().startsWith('import '))
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '$1 ($2)')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function listSectionOperationPages(sectionDir: string): string[] {
  if (!existsSync(sectionDir)) {
    return [];
  }
  return readdirSync(sectionDir)
    .filter((name) => name.endsWith('.fr.mdx'))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => join(sectionDir, name));
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function buildSections(): BookSection[] {
  const apiRoot = join(DOCS_ROOT, 'api');
  const apiFiles: string[] = [];

  const overview = join(apiRoot, 'index.fr.mdx');
  if (existsSync(overview)) {
    apiFiles.push(overview);
  }

  for (const name of API_CONCEPT_PAGES) {
    const path = join(apiRoot, name);
    if (existsSync(path)) apiFiles.push(path);
  }

  for (const section of REST_API_SECTION_ORDER) {
    apiFiles.push(...listSectionOperationPages(join(apiRoot, section)));
  }

  for (const section of EXTRA_API_SECTIONS) {
    apiFiles.push(...listSectionOperationPages(join(apiRoot, section)));
  }

  const guideFiles = ADVANCED_GUIDE_ORDER.map((name) =>
    join(DOCS_ROOT, 'build/advanced-guides', name),
  ).filter((path) => existsSync(path));

  return [
    { title: 'Référence API REST lomi.', files: apiFiles },
    { title: 'Guides d’intégration avancés', files: guideFiles },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let inTable = false;
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
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
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

function wrapHtmlDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm 14mm; }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    h1, h2, h3, h4 { page-break-after: avoid; }
    h1 { font-size: 22pt; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    h2 { font-size: 16pt; margin-top: 28px; }
    h3 { font-size: 13pt; }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5pt;
    }
    pre {
      background: #f6f6f6;
      border: 1px solid #e5e5e5;
      padding: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      font-size: 9.5pt;
      page-break-inside: auto;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f3f3f3; }
    blockquote {
      border-left: 3px solid #999;
      margin-left: 0;
      padding-left: 12px;
      color: #333;
    }
    hr { border: none; border-top: 1px solid #ddd; margin: 28px 0; }
    @media print {
      body { padding: 0; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

function renderBook(sections: BookSection[]): string {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const openapiPath = join(process.cwd(), 'openapi.json');
  const openapiHash = existsSync(openapiPath) ? sha256File(openapiPath) : 'n/a';

  const lines: string[] = [
    '# lomi. - Documentation technique française (extrait réglementaire)',
    '',
    `> Généré le ${generatedAt} depuis \`apps/docs\`.`,
    '> Périmètre : référence API marchande publique et guides avancés. Exclut Start, UI, plugins e-commerce et pages contributeur.',
    '> Ce livre Markdown ne remplace pas le contrat OpenAPI ni les pièces juridiques du dossier BCEAO.',
    `> Empreinte SHA-256 de \`apps/docs/openapi.json\` au moment de la génération : \`${openapiHash}\`.`,
    '',
    '## Table des matières',
    '',
  ];

  for (const section of sections) {
    lines.push(`- **${section.title}** (${section.files.length} pages)`);
    for (const file of section.files) {
      const { title } = stripFrontmatter(readFileSync(file, 'utf-8'));
      const slug = basename(file, '.fr.mdx');
      lines.push(`  - ${title ?? slug}`);
    }
    lines.push('');
  }

  for (const section of sections) {
    lines.push('---', '', `# ${section.title}`, '');
    for (const file of section.files) {
      const raw = readFileSync(file, 'utf-8');
      const { title, body } = stripFrontmatter(raw);
      const rel = relative(DOCS_ROOT, file);
      lines.push(
        `## ${title ?? basename(file, '.fr.mdx')}`,
        '',
        `_Source : ${rel}_`,
        '',
      );
      lines.push(sanitizeMdxForPrint(body), '', '---', '');
    }
  }

  lines.push(
    '## Annexe - Contrat OpenAPI',
    '',
    'Le schéma machine-readable complet est disponible dans le dépôt : `apps/docs/openapi.json`.',
    `Empreinte SHA-256 : \`${openapiHash}\`.`,
    'Joindre cette empreinte au paquet transmis si la BCEAO ou un auditeur exige la traçabilité du contrat.',
    '',
  );

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

function exportPdfFromHtml(htmlPath: string, pdfPath: string): void {
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

async function main(): Promise<void> {
  const { outPath, pdf } = parseArgs();
  const sections = buildSections();
  const totalPages = sections.reduce((sum, s) => sum + s.files.length, 0);

  if (totalPages === 0) {
    console.error('No French pages found for export.');
    process.exit(1);
  }

  const book = renderBook(sections);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, book, 'utf-8');

  const htmlPath = outPath.replace(/\.md$/i, '.html');
  const html = wrapHtmlDocument(
    'lomi. - Documentation technique française',
    markdownToHtml(book),
  );
  writeFileSync(htmlPath, html, 'utf-8');

  console.log(`Wrote ${totalPages} pages to ${outPath}`);
  console.log(`Wrote HTML to ${htmlPath}`);
  for (const section of sections) {
    console.log(`  - ${section.title}: ${section.files.length}`);
  }

  if (pdf) {
    const pdfPath = outPath.replace(/\.md$/i, '.pdf');
    exportPdfFromHtml(htmlPath, pdfPath);
    console.log(`Wrote PDF to ${pdfPath}`);
  } else {
    console.log('Tip: add --pdf to also generate a Chrome headless PDF.');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
