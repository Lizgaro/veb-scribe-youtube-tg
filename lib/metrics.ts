import { topKeywords } from './analyzer.js';

export type Metrics = {
  durationSec: number | null;
  segmentCount: number | null;
  wordCount: number;
  wordsPerMinute: number | null;
  topKeywords: string[];
};

export function computeMetrics(text: string, opts?: { durationSec?: number | null; segmentCount?: number | null }) : Metrics {
  const words = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
  const durationSec = opts?.durationSec ?? null;
  const segmentCount = opts?.segmentCount ?? null;
  const wpm = durationSec ? Math.round((words / durationSec) * 60) : null;
  const keywords = topKeywords(text, 10);
  return {
    durationSec,
    segmentCount,
    wordCount: words,
    wordsPerMinute: wpm,
    topKeywords: keywords,
  };
}
