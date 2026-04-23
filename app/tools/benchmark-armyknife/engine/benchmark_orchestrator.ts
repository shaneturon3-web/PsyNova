import { benchmarkWebsite } from '../adapters/website_adapter.js';
import type { WebsiteBenchmarkInput } from '../adapters/website_adapter.js';
import { createSelectionState } from '../ui/checkbox_engine.js';
import { toJson } from '../export/json_exporter.js';
import { renderMarkdownTable } from '../export/benchmark_report.js';
import { filterTreeSelected } from '../ui/checkbox_engine.js';

export interface OrchestratorOptions {
  websites: WebsiteBenchmarkInput[];
  /** Pre-select all node ids for export demo, or empty */
  preselectAll?: boolean;
}

export async function runBenchmarkOrchestrator(opts: OrchestratorOptions) {
  const results = await Promise.all(opts.websites.map((w) => benchmarkWebsite(w)));
  const table = results.map((r) => r.scores);
  const firstTree = results[0]?.tree;
  let selectedTree: { nodes: import('../core/types.js').TreeNode[] } | null = null;
  if (firstTree) {
    const st = createSelectionState(firstTree);
    if (opts.preselectAll) {
      st.setChecked(firstTree.id, true);
    }
    const filtered = filterTreeSelected(firstTree, new Set(st.exportSelectedIds()));
    selectedTree = filtered ? { nodes: [filtered] } : { nodes: [] };
  }
  const payload = {
    benchmark_results: table,
    selected_tree: selectedTree,
    meta: { protocol: 'Benchmark Armyknife Protocol v1.0', tag: 'MOCKUP-PURPOSE-ONLY' },
  };
  return {
    results,
    markdownTable: renderMarkdownTable(table),
    json: toJson(payload),
    payload,
  };
}
