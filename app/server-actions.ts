"use server";

import { createPromptForLLM, analyzeText } from "../lib/analyzer.js";
import { fetchTranscript } from "../lib/youtube";
import { computeMetrics } from "../lib/metrics";
import { generateTextWithHuggingFace } from "../lib/llm.js";

// Inline variant to work on serverless (no cross-request memory needed)
export type AnalyzeState = {
  ok: boolean;
  error?: string;
  input?: string;
  analysis?: string;
  transcriptText?: string;
  title?: string;
  description?: string;
  metrics?: {
    durationSec: number | null;
    segmentCount: number | null;
    wordCount: number;
    wordsPerMinute: number | null;
    topKeywords: string[];
  };
};

export async function analyzeInline(_prevState: AnalyzeState, formData: FormData): Promise<AnalyzeState> {
  const input = String(formData.get("input") || "").trim();
  if (!input) return { ok: false, error: "Пустой ввод" };
  try {
    let sourceText = input;
    let metrics: AnalyzeState["metrics"] | undefined;
    let title: string | undefined;
    let description: string | undefined;

    if (/youtube\.com|youtu\.be/i.test(input)) {
      const t = await fetchTranscript(input);
      sourceText = t.text || input;
      title = t.title;
      description = t.description;
      metrics = computeMetrics(sourceText, { durationSec: t.durationSec, segmentCount: t.segments.length });
    } else {
      metrics = computeMetrics(sourceText);
    }
    const analysis = analyzeText(sourceText);
    return { ok: true, input, analysis, transcriptText: sourceText, title, description, metrics };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Ошибка анализа" };
  }
}

export type GenerateState = { ok: boolean; error?: string; post?: string };

export async function generatePostWithLLM(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  try {
    const transcript = String(formData.get("transcript") || "");
    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    const topic = String(formData.get("topic") || "").trim();

    if (!transcript || !title) {
        return { ok: false, error: "Отсутствует транскрипт или заголовок для генерации." };
    }

    const prompt = createPromptForLLM(transcript, title, description, topic, "telegram");

    const post = await generateTextWithHuggingFace(prompt);

    return { ok: true, post };
  } catch (e: any) {
    console.error("[generatePostWithLLM]", e);
    return { ok: false, error: e?.message || "Ошибка генерации" };
  }
}