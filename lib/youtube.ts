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

async function tryFetchTranscriptAnyLang(id: string): Promise<YTSegment[] | null> {
  try {
    // Let the library automatically find the best available transcript
    const segs = (await YoutubeTranscript.fetchTranscript(id)) as any as YTSegment[];
    if (segs?.length) return segs;
  } catch (_) {
    // continue
  }
  return null;
}

function htmlUnescape(s: string) {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\u0026/g, '&')
    .replace(/\u003c/g, '<')
    .replace(/\u003e/g, '>');
}

async function fetchDescriptionFallback(id: string): Promise<YTTranscript> {
  const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=ru`);
  if (!res.ok) throw new Error(`Не удалось загрузить страницу видео: ${res.status}`);
  const html = await res.text();

  // Try to extract shortDescription and lengthSeconds from the embedded JSON
  const descMatch = html.match(/"shortDescription":"([\s\S]*?)"/);
  const lenMatch = html.match(/"lengthSeconds":"?(\d+)"?/);
  const descRaw = descMatch?.[1] ?? '';
  const desc = htmlUnescape(descRaw);
  const lengthSeconds = lenMatch ? parseInt(lenMatch[1], 10) : null;

  if (!desc.trim()) {
    throw new Error('На видео отключены субтитры и недоступно описание');
  }

  const sentences = desc
    .split(/(?:\.|!|\?|\n)+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const durationSec = lengthSeconds ?? Math.max(60, Math.min(1200, Math.round((desc.split(/\s+/).length / 150) * 60)));
  const approxPer = Math.max(3, Math.floor(durationSec / Math.max(1, sentences.length)));
  let offset = 0;
  const segments: YTSegment[] = sentences.map((t) => {
    const seg = { text: t, duration: approxPer, offset };
    offset += approxPer;
    return seg;
  });

  const text = desc;
  const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
  return { id, segments, text, durationSec, wordCount };
}

export async function fetchTranscript(input: string): Promise<YTTranscript> {
  const id = extractVideoId(input);
  if (!id) throw new Error('Не удалось извлечь ID видео YouTube');

  // 1) Try multiple languages
  const segs = await tryFetchTranscriptAnyLang(id);
  if (segs && segs.length) {
    const text = segs.map((s) => s.text).join(' ');
    const last = segs[segs.length - 1];
    const durationSec = Math.round((last?.offset ?? 0) + (last?.duration ?? 0));
    const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
    return { id, segments: segs, text, durationSec, wordCount };
  }

  // 2) Fallback to description scraping (best-effort)
  try {
    return await fetchDescriptionFallback(id);
  } catch (_) {
    // continue to metadata fallback
  }

  // 3) Final fallback: use oEmbed metadata (title/author)
  try {
    const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (oembed.ok) {
      const data = await oembed.json() as any;
      const title = (data?.title as string) || `YouTube Video ${id}`;
      const author = (data?.author_name as string) || '';
      const text = [title, author].filter(Boolean).join(' — ');
      const segments: YTSegment[] = text
        .split(/(?:\.|!|\?|\n)+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t, i) => ({ text: t, duration: 0, offset: i === 0 ? 0 : i * 3 }));
      const durationSec = null as unknown as number; // preserve type; downstream treats null as unknown
      const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
      return { id, segments, text, durationSec, wordCount };
    }
  } catch (_) {
    // ignore
  }

  // 4) Absolute minimal fallback: use ID as text to keep pipeline alive
  const text = `YouTube video: ${id}`;
  const segments: YTSegment[] = [{ text, duration: 0, offset: 0 }];
  const durationSec = null as unknown as number;
  const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
  return { id, segments, text, durationSec, wordCount };
}
