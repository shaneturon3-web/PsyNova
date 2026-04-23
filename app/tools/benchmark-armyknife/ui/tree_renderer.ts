import type { TreeNode } from '../core/types.js';

/** Plain-text tree for logs / CLI (not a dashboard). */
export function renderTreeAscii(node: TreeNode, depth = 0): string {
  const pad = '  '.repeat(depth);
  const line = `${pad}- [${node.type}] ${node.label} (${node.id})\n`;
  return line + node.children.map((c) => renderTreeAscii(c, depth + 1)).join('');
}
