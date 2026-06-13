import { fetchUrl } from '../core/fetch_engine.js';
import { parseHtmlToTree } from '../core/parser_dom_tree.js';
import { scorePerformance } from '../core/performance_model.js';
import { scorePower } from '../core/power_model.js';
import { scoreCostEfficiency } from '../core/cost_model.js';
import { fetchNpmDownloads, scorePopularity } from '../core/popularity_engine.js';
import { buildToolScores } from '../core/scorer.js';
import type { FetchResult, TreeNode } from '../core/types.js';

export interface WebsiteBenchmarkInput {
  url: string;
  label: string;
  npmPackage?: string;
}

export interface WebsiteBenchmarkOutput {
  url: string;
  label: string;
  fetch: FetchResult;
  tree: TreeNode;
  scores: ReturnType<typeof buildToolScores>;
}

export async function benchmarkWebsite(input: WebsiteBenchmarkInput): Promise<WebsiteBenchmarkOutput> {
  const fetch = await fetchUrl(input.url);
  const tree = parseHtmlToTree(fetch.html);
  const power = scorePower(tree);
  const performance = scorePerformance(fetch.latencyMs);
  const htmlLower = fetch.html.toLowerCase();
  const cost = scoreCostEfficiency({
    freeTierHint: /free|gratuit/i.test(htmlLower),
    hasRateLimitMention: /rate.?limit|quota/i.test(htmlLower),
  });
  const npmDl = input.npmPackage ? await fetchNpmDownloads(input.npmPackage) : 0;
  const popularity = await scorePopularity({
    npmWeeklyDownloads: npmDl,
    mentionScore: 40,
  });
  const scores = buildToolScores(input.label, {
    power,
    popularity,
    performance,
    costEfficiency: cost,
  });
  return { url: input.url, label: input.label, fetch, tree, scores };
}
