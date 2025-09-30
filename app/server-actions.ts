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
