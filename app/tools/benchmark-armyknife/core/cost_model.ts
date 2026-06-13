/** 0–100 cost efficiency (higher = cheaper / better value). Stubs until pricing APIs wired. */
export function scoreCostEfficiency(hints: { hasRateLimitMention?: boolean; freeTierHint?: boolean } = {}): number {
  let s = 70;
  if (hints.freeTierHint) s += 15;
  if (hints.hasRateLimitMention) s -= 5;
  return Math.max(0, Math.min(100, s));
}
