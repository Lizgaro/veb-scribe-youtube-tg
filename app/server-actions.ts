"use server";

import { redirect } from "next/navigation";
import { store } from "../store/memory";
import { analyzeText, generatePost } from "../lib/analyzer";
import { fetchTranscript } from "../lib/youtube";
import { computeMetrics } from "../lib/metrics";

export async function analyze(formData: FormData) {
  const input = String(formData.get("input") || "").trim();
  if (!input) return;
  const id = crypto.randomUUID();
  let sourceText = input;
  let metrics = undefined as any;
  try {
    if (/youtube\.com|youtu\.be/i.test(input)) {
      const t = await fetchTranscript(input);
      sourceText = t.text || input;
      metrics = computeMetrics(sourceText, { durationSec: t.durationSec, segmentCount: t.segments.length });
    } else {
      metrics = computeMetrics(sourceText);
    }
  } catch (e) {
    metrics = computeMetrics(sourceText);
  }
  const analysis = analyzeText(sourceText);
  store.save({ id, input, analysis, transcriptText: sourceText !== input ? sourceText : undefined, metrics });
  redirect(`/analysis/${id}`);
}

export async function generate(formData: FormData) {
  const id = String(formData.get("id") || "");
  const topic = String(formData.get("topic") || "").trim();
  const rec = store.get(id);
  if (!rec) return;
  const post = generatePost(rec.analysis, topic || "Новая тема", "telegram");
  store.setPost(id, post);
  redirect(`/analysis/${id}`);
}

// Inline variant to work on serverless (no cross-request memory needed)
export type AnalyzeState = {
  ok: boolean;
  error?: string;
  input?: string;
  analysis?: string;
  transcriptText?: string;
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
    if (/youtube\.com|youtu\.be/i.test(input)) {
      const t = await fetchTranscript(input);
      sourceText = t.text || input;
      metrics = computeMetrics(sourceText, { durationSec: t.durationSec, segmentCount: t.segments.length });
    } else {
      metrics = computeMetrics(sourceText);
    }
    const analysis = analyzeText(sourceText);
    return { ok: true, input, analysis, transcriptText: sourceText !== input ? sourceText : undefined, metrics };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Ошибка анализа" };
  }
}

export type GenerateState = { ok: boolean; error?: string; post?: string };

export async function generateFromAnalysis(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  try {
    const analysis = String(formData.get("analysis") || "");
    const topic = String(formData.get("topic") || "").trim();
    if (!analysis) return { ok: false, error: "Нет анализа" };
    const post = generatePost(analysis, topic || "Новая тема", "telegram");
    return { ok: true, post };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Ошибка генерации" };
  }
}
