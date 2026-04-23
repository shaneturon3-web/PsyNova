import * as cheerio from 'cheerio';
import type { TreeNode } from './types.js';

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}_${String(idSeq).padStart(4, '0')}`;
}

function resetIds(): void {
  idSeq = 0;
}

/**
 * Heuristic DOM → tree: headings, sections, lists, key actionables.
 * No headless browser — cheerio only. Depth bounded by selector passes.
 */
export function parseHtmlToTree(html: string, _maxDepth = 8): TreeNode {
  resetIds();
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();

  const root: TreeNode = {
    id: nextId('root'),
    label: 'Document',
    type: 'root',
    children: [],
  };

  $('section, article').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h1,h2,h3').first().text().trim().slice(0, 120);
    const sec: TreeNode = {
      id: nextId('sec'),
      label: title || '(section)',
      type: 'section',
      children: [],
    };
    $el.find('> ul > li, ul > li').each((i, li) => {
      if (i > 25) return false;
      const t = $(li).text().trim().slice(0, 160);
      if (t)
        sec.children.push({
          id: nextId('li'),
          label: t,
          type: 'listitem',
          children: [],
        });
    });
    if (sec.children.length || title) root.children.push(sec);
  });

  if (root.children.length === 0) {
    $('h1, h2, h3, h4').each((_, el) => {
      const t = $(el).text().trim().slice(0, 200);
      if (t)
        root.children.push({
          id: nextId('h'),
          label: t,
          type: 'heading',
          children: [],
        });
    });
  }

  $('button, a[href], input[placeholder]').each((i, el) => {
    if (i > 30) return false;
    const $el = $(el);
    const tag = el.tagName?.toLowerCase() ?? '';
    const label =
      tag === 'input'
        ? ($el.attr('placeholder') || $el.attr('name') || 'input').slice(0, 80)
        : $el.text().trim().slice(0, 80) || $el.attr('aria-label')?.slice(0, 80) || tag;
    if (label)
      root.children.push({
        id: nextId('act'),
        label,
        type: 'actionable',
        children: [],
        meta: { tag },
      });
  });

  if (root.children.length === 0) {
    root.children.push({
      id: nextId('inf'),
      label: '(no structure inferred)',
      type: 'inferred',
      children: [],
    });
  }

  return root;
}
