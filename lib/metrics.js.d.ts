export type Metrics = {
  durationSec: number | null;
  segmentCount: number | null;
  wordCount: number;
  wordsPerMinute: number | null;
  topKeywords: string[];
};

export function computeMetrics(
  text: string,
  opts?: { durationSec?: number | null; segmentCount?: number | null }
): Metrics;
