/**
 * Auditoría ligera orientada a tema / presentación (sin headless).
 * MOCKUP-PURPOSE-ONLY
 */
import * as cheerio from 'cheerio';

export interface ThemeAuditResult {
  url: string;
  httpStatus?: number;
  stylesheets: string[];
  preloadStyles: string[];
  inlineStyleBlockCount: number;
  metaThemeColor: string | null;
  bodyClass: string | null;
  htmlClass: string | null;
  wpThemeSlugs: string[];
  frameworkHints: string[];
  /** 0–100 heurístico: diversidad de fuentes de estilo + señales de tema */
  themeSurfaceScore: number;
}

const FW_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'Tailwind', re: /\btw-[\w-]+\b|tailwindcss|cdn\.tailwindcss/i },
  { name: 'Bootstrap', re: /\bbootstrap[\w.-]*\.(css|js)|getbootstrap\.com/i },
  { name: 'Bulma', re: /\bbulma\b|cdn\.jsdelivr\.net\/npm\/bulma/i },
  { name: 'Foundation', re: /\bfoundation(\.min)?\.css|foundation\.zurb/i },
  { name: 'Material / MUI', re: /@material|mui\.com|materializecss/i },
  { name: 'WordPress block theme', re: /wp-block-library|wp-includes\/css\/dist\/block-library/i },
];

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function auditThemeFromHtml(url: string, html: string): ThemeAuditResult {
  const $ = cheerio.load(html);
  const stylesheets: string[] = [];
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const h = $(el).attr('href');
    if (h) stylesheets.push(h);
  });
  $('link[href]').each((_, el) => {
    const h = $(el).attr('href');
    const rel = ($(el).attr('rel') || '').toLowerCase();
    if (h && /\.css(\?|$)/i.test(h) && !rel.includes('icon') && !rel.includes('apple')) {
      stylesheets.push(h);
    }
  });
  const preloadStyles: string[] = [];
  $('link[rel="preload"][as="style"][href]').each((_, el) => {
    const h = $(el).attr('href');
    if (h) preloadStyles.push(h);
  });
  const inlineStyleBlockCount = $('style').length;
  const metaThemeColor = $('meta[name="theme-color"]').attr('content')?.trim() || null;
  const bodyClass = $('body').attr('class')?.trim() || null;
  const htmlClass = $('html').attr('class')?.trim() || null;

  const combined = `${html}\n${stylesheets.join('\n')}`;
  const wpSlugs = new Set<string>();
  for (const m of combined.matchAll(/\/wp-content\/themes\/([^/]+)\//gi)) {
    wpSlugs.add(m[1]);
  }

  const frameworkHints: string[] = [];
  for (const { name, re } of FW_PATTERNS) {
    if (re.test(html) || stylesheets.some((s) => re.test(s))) {
      frameworkHints.push(name);
    }
  }

  const sheetList = uniq(stylesheets);
  const nSheets = sheetList.length + preloadStyles.length;
  const nWp = wpSlugs.size;
  const nFw = frameworkHints.length;
  const inlineForScore = Math.min(inlineStyleBlockCount, 40);
  const themeSurfaceScore = Math.min(
    100,
    Math.round(nSheets * 6 + inlineForScore * 2 + nWp * 15 + nFw * 12 + (metaThemeColor ? 5 : 0)),
  );

  return {
    url,
    stylesheets: sheetList,
    preloadStyles: uniq(preloadStyles),
    inlineStyleBlockCount,
    metaThemeColor,
    bodyClass,
    htmlClass,
    wpThemeSlugs: [...wpSlugs],
    frameworkHints: uniq(frameworkHints),
    themeSurfaceScore,
  };
}

export function renderThemeAuditMarkdown(r: ThemeAuditResult): string {
  const lines: string[] = [
    `## Theme audit`,
    ``,
    `- **URL:** ${r.url}`,
    ...(r.httpStatus != null ? [`- **HTTP:** ${r.httpStatus}`] : []),
    `- **theme-color (meta):** ${r.metaThemeColor ?? '—'}`,
    `- **&lt;html&gt; class:** ${r.htmlClass ?? '—'}`,
    `- **&lt;body&gt; class:** ${r.bodyClass ?? '—'}`,
    `- **Stylesheets (${r.stylesheets.length}):**`,
  ];
  for (const href of r.stylesheets) {
    lines.push(`  - \`${href}\``);
  }
  if (r.preloadStyles.length) {
    lines.push(`- **Preload CSS (${r.preloadStyles.length}):**`);
    for (const href of r.preloadStyles) {
      lines.push(`  - \`${href}\``);
    }
  }
  lines.push(`- **Bloques &lt;style&gt; inline:** ${r.inlineStyleBlockCount}`);
  lines.push(`- **WordPress theme slug(s) (heurística):** ${r.wpThemeSlugs.length ? r.wpThemeSlugs.join(', ') : '—'}`);
  lines.push(`- **Pistas de framework / stack:** ${r.frameworkHints.length ? r.frameworkHints.join(', ') : '—'}`);
  lines.push(`- **Theme surface score (0–100, heurístico):** ${r.themeSurfaceScore}`);
  return lines.join('\n');
}
