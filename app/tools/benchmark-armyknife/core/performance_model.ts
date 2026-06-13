/** Map latency (ms) to 0–100 performance score (lower latency → higher score). */
export function scorePerformance(latencyMs: number): number {
  if (latencyMs <= 100) return 100;
  if (latencyMs >= 8000) return 10;
  return Math.round(100 - (latencyMs / 8000) * 90);
}
