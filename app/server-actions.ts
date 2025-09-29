"use server";

import { redirect } from "next/navigation";
import { store } from "../store/memory";
import { analyzeText, generatePost } from "../lib/analyzer";

export async function analyze(formData: FormData) {
  const input = String(formData.get("input") || "").trim();
  if (!input) return;
  const id = crypto.randomUUID();
  const analysis = analyzeText(input);
  store.save({ id, input, analysis });
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
