/**
 * Popularity 0–100. Spec: log blend of stars, downloads, etc.
 * Default: conservative stub. Optional: fetch npm downloads for package name.
 */
export async function scorePopularity(input: {
  githubStars?: number;
  npmWeeklyDownloads?: number;
  mentionScore?: number;
}): Promise<number> {
  const stars = input.githubStars ?? 0;
  const dl = input.npmWeeklyDownloads ?? 0;
  const m = input.mentionScore ?? 30;
  const blend = Math.log1p(stars) * 8 + Math.log1p(dl) * 3 + m * 0.4;
  return Math.round(Math.max(0, Math.min(100, blend)));
}

export async function fetchNpmDownloads(packageName: string): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return 0;
    const j = (await r.json()) as { downloads?: number };
    return j.downloads ?? 0;
  } catch {
    return 0;
  }
}
