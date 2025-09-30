// @ts-check
import { topKeywords } from './analyzer.js';

/**
 * @typedef {Object} Metrics
 * @property {number | null} durationSec
 * @property {number | null} segmentCount
 * @property {number} wordCount
 * @property {number | null} wordsPerMinute
 * @property {string[]} topKeywords
 */

/**
 * @param {string} text
 * @param {{ durationSec?: number | null, segmentCount?: number | null }} [opts]
 * @returns {Metrics}
 */
export function computeMetrics(text, opts) {
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
