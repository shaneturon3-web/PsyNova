#!/usr/bin/env node
/**
 * Benchmark Armyknife Protocol v1.0 — CLI entry
 * Autor concepto: Shane (especificacion) · implementacion esqueleto ejecutable
 */
import { fetchUrl } from './core/fetch_engine.js';
import { auditThemeFromHtml, renderThemeAuditMarkdown } from './core/theme_audit.js';
import { runBenchmarkOrchestrator } from './engine/benchmark_orchestrator.js';
import { renderTreeAscii } from './ui/tree_renderer.js';

/** Acepta `medipsy.ca/path` sin esquema. */
export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const themeOnly = argv.includes('--theme');
  const urls = argv.filter((a) => !a.startsWith('-')).map(normalizeUrl);

  if (themeOnly) {
    if (urls.length === 0) {
      console.error('[benchmark-armyknife] --theme requiere al menos una URL.');
      process.exit(1);
    }
    console.error('[benchmark-armyknife] theme-only audit:', urls.join(', '));
    for (const url of urls) {
      const fr = await fetchUrl(url);
      if (fr.status >= 400) {
        console.error(`[benchmark-armyknife] HTTP ${fr.status} for ${url}`);
      }
      const audit = auditThemeFromHtml(url, fr.html);
      console.log(renderThemeAuditMarkdown({ ...audit, httpStatus: fr.status }));
      console.log('');
    }
    console.log('tag: MOCKUP-PURPOSE-ONLY');
    return;
  }

  const targets =
    urls.length > 0
      ? urls.map((url, i) => ({ url, label: `Target_${i + 1}` }))
      : [{ url: 'https://example.com', label: 'example.com (demo)' }];

  console.error('[benchmark-armyknife] fetching', targets.map((t) => t.url).join(', '));

  const out = await runBenchmarkOrchestrator({
    websites: targets,
    preselectAll: false,
  });

  console.log('=== Markdown table ===\n');
  console.log(out.markdownTable);
  console.log('\n=== Tree sample (first URL) ===\n');
  if (out.results[0]) {
    console.log(renderTreeAscii(out.results[0].tree));
  }
  console.log('\n=== JSON export ===\n');
  console.log(out.json);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
