import { YoutubeTranscript } from 'youtube-transcript';

export type YTSegment = { text: string; duration: number; offset: number };
export type YTTranscript = {
  id: string;
  title: string;
  description: string;
  segments: YTSegment[];
  text: string;
  durationSec: number;
  wordCount: number;
};

async function fetchVideoDetails(id: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY is not set. Falling back to oEmbed.");
    return null;
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch video details from YouTube API: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const snippet = data.items?.[0]?.snippet;
  if (!snippet) {
    console.error("No video snippet found in YouTube API response.");
    return null;
  }

  return {
    title: snippet.title,
    description: snippet.description,
  };
}

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

export async function fetchTranscript(input: string): Promise<YTTranscript> {
  const id = extractVideoId(input);
  if (!id) throw new Error('Не удалось извлечь ID видео YouTube');

  // Fetch details and transcript in parallel
  const [details, segs] = await Promise.all([
    fetchVideoDetails(id),
    tryFetchTranscriptAnyLang(id),
  ]);

  let text: string;
  let segments: YTSegment[];
  let durationSec: number | null;
  let title = details?.title;
  let description = details?.description || '';

  if (segs?.length) {
    // --- Primary case: Transcript is available ---
    text = segs.map((s) => s.text).join(' ');
    segments = segs;
    const last = segs[segs.length - 1];
    durationSec = Math.round((last?.offset ?? 0) + (last?.duration ?? 0));
  } else {
    // --- Fallback case: No transcript available ---
    durationSec = null;
    // Use description from API if available
    if (details?.description) {
      text = details.description;
    } else {
      // Fallback further to oEmbed if no details from API
      try {
        const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
        if (oembed.ok) {
          const data = await oembed.json() as any;
          if (!title) title = (data?.title as string) || `YouTube Video ${id}`;
          text = [title, (data?.author_name as string) || ''].filter(Boolean).join(' — ');
        } else {
          text = `YouTube video: ${id}`; // Minimal fallback
        }
      } catch (e) {
        console.error(`[yt-fallback-oembed] failed for id=${id}:`, e);
        text = `YouTube video: ${id}`; // Minimal fallback
      }
    }

    // Create coarse segments from the fallback text
    segments = text.split(/(?:\.|!|\?|\n)+/).map((s) => s.trim()).filter(Boolean).map((t, i) => ({ text: t, duration: 0, offset: i * 3 }));
  }

  // Final check for title if it's still missing
  if (!title) {
    try {
      const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      if (oembed.ok) {
        const data = await oembed.json() as any;
        title = (data?.title as string) || `YouTube Video ${id}`;
      } else {
        title = `YouTube Video ${id}`;
      }
    } catch (e) {
      title = `YouTube Video ${id}`;
    }
  }

  const wordCount = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;

  return {
    id,
    title,
    description,
    segments,
    text,
    durationSec: durationSec as unknown as number, // Preserve type for downstream
    wordCount,
  };
}