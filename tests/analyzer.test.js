import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, createPromptForLLM } from '../lib/analyzer.js';

test('analyzeText returns markdown with key sections', () => {
  const input = 'Это тестовый текст про бизнес и рост. Как добиться результата быстро? Вот секрет.';
  const md = analyzeText(input);
  assert.ok(md.includes('💎 Глубинный анализ контента'));
  assert.ok(md.includes('🧠 Психологический профиль'));
  assert.ok(md.includes('🚀 Виральные элементы'));
  assert.ok(md.includes('🛠️ Структура и формат'));
  assert.ok(md.includes('📈 Рекомендации для генерации'));
});

test('createPromptForLLM creates a detailed prompt string', () => {
  const transcript = 'Это транскрипт видео. В нем говорится о важных вещах.';
  const title = 'Важное видео';
  const description = 'Описание важного видео.';
  const topic = 'Новая тема';

  const prompt = createPromptForLLM(transcript, title, description, topic, 'telegram');

  assert.match(prompt, /# Задача: Создай уникальный и интересный пост/);
  assert.match(prompt, /Название:.*Важное видео/);
  assert.match(prompt, /Описание:.*Описание важного видео/);
  assert.match(prompt, /Пользовательская тема \(опционально\):.*Новая тема/);
  assert.match(prompt, /Это транскрипт видео/);
});