import { YoutubeTranscript } from 'youtube-transcript';

export type YTSegment = { text: string; duration: number; offset: number };
export type YTTranscript = {
  id: string;
  segments: YTSegment[];
  text: string;
  durationSec: number;
  wordCount: number;
};

export function extractVideoId(input: string): string | null {
  // Supports youtu.be/VIDEOID and youtube.com/watch?v=VIDEOID and youtube.com/shorts/VIDEOID
  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1) || null;
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'shorts');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    // maybe raw id
    if (/^[a-zA-Z0-9_-]{6,}$/.test(input)) return input;
    return null;
  }
}

export async function fetchTranscript(input: string): Promise<YTTranscript> {
  const id = extractVideoId(input);
  if (!id) throw new Error('Не удалось извлечь ID видео YouTube');
  const segments = (await YoutubeTranscript.fetchTranscript(id, { lang: 'ru' })) as any as YTSegment[];
  const text = segments.map((s) => s.text).join(' ');
  const last = segments[segments.length - 1];
  const durationSec = Math.round((last?.offset ?? 0) + (last?.duration ?? 0));
  const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
  return { id, segments, text, durationSec, wordCount };
}
