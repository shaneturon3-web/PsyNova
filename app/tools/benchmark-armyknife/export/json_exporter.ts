import type { TreeNode } from '../core/types.js';
import type { ToolScores } from '../core/types.js';

export interface ExportPayload {
  benchmark_results: ToolScores[];
  selected_tree: { nodes: TreeNode[] } | null;
  meta: { protocol: string; tag: string };
}

export function toJson(payload: ExportPayload, pretty = true): string {
  return JSON.stringify(payload, null, pretty ? 2 : undefined);
}
