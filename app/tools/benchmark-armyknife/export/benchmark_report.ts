import type { ToolScores } from '../core/types.js';

export function renderMarkdownTable(rows: ToolScores[]): string {
  const head = '| Name | Total | Power | Popularity | Performance | Cost eff. |\n| --- | --- | --- | --- | --- | --- |\n';
  const body = rows
    .map(
      (r) =>
        `| ${r.name} | ${r.total} | ${r.power} | ${r.popularity} | ${r.performance} | ${r.costEfficiency} |`,
    )
    .join('\n');
  return head + body;
}
