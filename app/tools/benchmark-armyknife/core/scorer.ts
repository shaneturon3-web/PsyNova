import { SCORE_WEIGHTS, type ToolScores } from './types.js';

export function compositeScore(parts: Omit<ToolScores, 'name' | 'total'>): number {
  const t =
    parts.power * SCORE_WEIGHTS.power +
    parts.popularity * SCORE_WEIGHTS.popularity +
    parts.performance * SCORE_WEIGHTS.performance +
    parts.costEfficiency * SCORE_WEIGHTS.costEfficiency;
  return Math.round(t * 10) / 10;
}

export function buildToolScores(name: string, parts: Omit<ToolScores, 'name' | 'total'>): ToolScores {
  const total = compositeScore(parts);
  return { name, ...parts, total };
}
