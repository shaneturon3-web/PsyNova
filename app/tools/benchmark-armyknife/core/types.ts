/** Shared tree + benchmark types — Benchmark Armyknife Protocol v1.0 */

export type NodeType = 'root' | 'section' | 'heading' | 'list' | 'listitem' | 'actionable' | 'container' | 'inferred';

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  children: TreeNode[];
  meta?: Record<string, string | number | boolean>;
}

export interface FetchResult {
  url: string;
  status: number;
  html: string;
  latencyMs: number;
}

export interface ToolScores {
  name: string;
  power: number;
  popularity: number;
  performance: number;
  costEfficiency: number;
  total: number;
}

export const SCORE_WEIGHTS = {
  power: 0.35,
  popularity: 0.25,
  performance: 0.2,
  costEfficiency: 0.2,
} as const;
