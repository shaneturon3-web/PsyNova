import type { FetchResult } from './types.js';

const cache = new Map<string, { at: number; result: FetchResult }>();
const TTL_MS = 15 * 60 * 1000;

export interface FetchOptions {
  timeoutMs?: number;
  useCache?: boolean;
}

/**
 * Lightweight fetch (no headless). Aggressive cache by URL hash key.
 */
export async function fetchUrl(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const { timeoutMs = 15000, useCache = true } = options;
  const key = url;
  if (useCache) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return hit.result;
    }
  }

  const t0 = performance.now();
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BenchmarkArmyknife/1.0 (research; +https://example.invalid)' },
    });
    const html = await res.text();
    const latencyMs = performance.now() - t0;
    const result: FetchResult = {
      url,
      status: res.status,
      html,
      latencyMs,
    };
    if (useCache) cache.set(key, { at: Date.now(), result });
    return result;
  } finally {
    clearTimeout(to);
  }
}

export function clearFetchCache(): void {
  cache.clear();
}
