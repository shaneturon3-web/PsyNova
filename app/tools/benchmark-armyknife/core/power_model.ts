import type { TreeNode } from './types.js';

function countNodes(n: TreeNode): number {
  return 1 + n.children.reduce((a, c) => a + countNodes(c), 0);
}

function maxDepth(n: TreeNode, d = 0): number {
  if (!n.children.length) return d;
  return Math.max(...n.children.map((c) => maxDepth(c, d + 1)));
}

/** 0–100: inferred from tree richness (features ~ nodes + depth). */
export function scorePower(tree: TreeNode): number {
  const n = countNodes(tree);
  const depth = maxDepth(tree);
  const raw = Math.min(100, n * 1.2 + depth * 8);
  return Math.round(Math.min(100, raw));
}
