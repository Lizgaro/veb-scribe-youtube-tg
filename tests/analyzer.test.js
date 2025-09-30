import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, generatePost } from '../lib/analyzer.js';

test('analyzeText returns markdown with key sections', () => {
  const input = 'Это тестовый текст про бизнес и рост. Как добиться результата быстро? Вот секрет.';
  const md = analyzeText(input);
  assert.ok(md.includes('💎 Глубинный анализ контента'));
  assert.ok(md.includes('🧠 Психологический профиль'));
  assert.ok(md.includes('🚀 Виральные элементы'));
  assert.ok(md.includes('🛠️ Структура и формат'));
  assert.ok(md.includes('📈 Рекомендации для генерации'));
});

test('generatePost creates a post string', () => {
  const md = analyzeText('Простой лайфхак и быстрые шаги.');
  const post = generatePost(md, 'Личный бренд', 'telegram');
  assert.match(post, /Хук:/);
  assert.match(post, /Если было полезно/);
});
