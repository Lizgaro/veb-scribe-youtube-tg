// Minimal, rule-based analyzer to avoid external AI APIs.

const RU_STOPWORDS = new Set([
  "и","в","во","не","что","он","на","я","с","со","как","а","то","все","она","так","его","но","да","ты","к","у","же","вы","за","бы","по","только","ее","мне","было","вот","от","меня","еще","нет","о","из","ему","теперь","когда","даже","ну","вдруг","ли","если","уже","или","ни","быть","был","него","до","вас","нибудь","опять","уж","вам","ведь","там","потом","себя","ничего","ей","может","они","тут","где","есть","надо","ней","для","мы","тебя","их","чем","была","сам","чтоб","без","будто","чего","раз","тоже","себе","под","будет","ж","тогда","кто","этот","того","потому","этого","какой","совсем","ним","здесь","этом","один","почти","мой","тем","чтобы","нее","кажется","сейчас","были","куда","зачем","всех","никогда","можно","при","наконец","два","об","другой","хоть","после","над","больше","тот","через","эти","нас","про","всего","них","какая","много","разве","три","эту","моя","впрочем","хорошо","свою","этой","перед","иногда","лучше","чуть","том","нельзя","такой","им","более","всегда","конечно","всю","между"
]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-яa-z0-9ё-]+/g) || []).filter(w => w.length > 1);
}

function topKeywords(text, limit = 8) {
  const freq = new Map();
  for (const w of tokenize(text)) {
    if (RU_STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}

function detectPlatform(input) {
  if (/t\.me\//i.test(input)) return "Telegram";
  if (/youtube\.com|youtu\.be/i.test(input)) return "YouTube";
  return "Text";
}

function sentimentHeuristic(text) {
  const scores = { hope:0, fear:0, anger:0, curiosity:0 };
  const T = text.toLowerCase();
  const inc = (k, n=1)=> (scores[k]+=n);
  // very naive signals
  if (/(секрет|как|узнай|почему|зачем|что будет)/.test(T)) inc('curiosity',2);
  if (/(страх|риски|ошибка|провал|не делайте|опасно)/.test(T)) inc('fear',2);
  if (/(злюсь|несправедлив|бесит|обман)/.test(T)) inc('anger',2);
  if (/(можно|получится|решение|надежда|шанс|рост)/.test(T)) inc('hope',2);
  // fallback by punctuation
  if (/!?/.test(T)) inc('curiosity');
  const key = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  return key;
}

function audienceHeuristic(text) {
  if (/(предпринимател|бизнес|стартап)/i.test(text)) return "Начинающие предприниматели, ищущие практичные тактики роста";
  if (/(маркетолог|реклама|трафик)/i.test(text)) return "Маркетологи, фокус на перформанс и быстрые инсайты";
  if (/(разработчик|программист|код)/i.test(text)) return "Разработчики, ценящие четкие паттерны и примеры";
  return "Широкая аудитория, интересующаяся практичными советами";
}

function languageStyle(text) {
  if (/(регрессия|гипотеза|итерация|метрика|api|архитектура)/i.test(text)) return "Экспертный и сложный";
  if (/(лайфхак|просто|быстро|легко)/i.test(text)) return "Простой и разговорный";
  return "Нейтральный и понятный";
}

function keyTrigger(text) {
  if (/(секрет|как добиться|разбор ошибок)/i.test(text)) return "Обещание раскрыть секрет или разобрать ошибки";
  if (/(кейсы|примеры|результаты)/i.test(text)) return "Социальное доказательство через примеры";
  return "Ясное обещание практической пользы";
}

function hook(text) {
  const words = tokenize(text).slice(0, 20);
  return words.join(' ');
}

function retention(text) {
  const sentences = text.split(/[.!?\n]+/).map(s=>s.trim()).filter(Boolean);
  return sentences.slice(1, 4);
}

function cta(text) {
  if (/(подпис|жми|смотри|читай|скачай)/i.test(text)) return "Прямой: действие в конце (подписка/переход)";
  return "Скрытый: подталкивание через ценность контента";
}

export function analyzeText(input) {
  const platform = detectPlatform(input);
  const keywords = topKeywords(input, 8);
  const emotion = sentimentHeuristic(input);
  const audience = audienceHeuristic(input);
  const style = languageStyle(input);
  const trig = keyTrigger(input);
  const hk = hook(input);
  const ret = retention(input);
  const call = cta(input);

  return [
    "💎 Глубинный анализ контента",
    "",
    "🧠 Психологический профиль",
    "",
    `Основная эмоция: ${emotion}`,
    `Целевая аудитория: ${audience}`,
    `Ключевой триггер: ${trig}`,
    "",
    "🚀 Виральные элементы",
    "",
    `Хук (Первые 10%): ${hk || "короткое интригующее утверждение"}`,
    `Моменты удержания: ${ret.slice(0,3).map((s,i)=>`${i+1}) ${s}`).join(' ') || "2–3 сильных факта/обещания в середине"}`,
    `Призыв к действию (CTA): ${call}`,
    "",
    "🛠️ Структура и формат",
    "",
    `Каркас повествования: Проблема -> Неудачные попытки -> Открытие -> Решение -> Призыв`,
    `Стиль языка: ${style}`,
    `Самые сильные идеи: ${keywords.slice(0,5).map(k=>`«${k}»`).join(', ')}`,
    "",
    "📈 Рекомендации для генерации",
    "",
    `Ключевые слова для SEO: ${keywords.join(', ')}`,
    `Идеальный формат для репликации: ${platform === 'YouTube' ? 'Короткое видео (Shorts/Reels) с сильным открывающим кадром' : platform === 'Telegram' ? 'Тред из 5–7 сообщений с мини-итогами' : 'Лонгрид 800–1200 слов с четкими подзаголовками'}`,
  ].join('\n');
}

export function generatePost(analysisMarkdown, topic = "Новая тема", targetPlatform = "telegram") {
  // very simple generator: uses extracted pieces from analysis and topic
  const emotion = (analysisMarkdown.match(/Основная эмоция: (.+)/) || [,'нейтральность'])[1];
  const trig = (analysisMarkdown.match(/Ключевой триггер: (.+)/) || [,'Практическая польза'])[1];
  const style = (analysisMarkdown.match(/Стиль языка: (.+)/) || [,'Нейтральный'])[1];

  const opener = `Хук: ${trig}. ${topic ? 'Тема: ' + topic + '.' : ''}`;
  const body = `\n\nПочему это важно: коротко и по делу.\n— 1) Проблема: у большинства нет системы.\n— 2) Открытие: маленькие шаги дают непропорциональный результат.\n— 3) Решение: начни сегодня с одного действия.`;
  const closer = `\n\nЭмоция: ${emotion}. Если было полезно — сохрани и поделись.`;

  const post = [opener, body, closer].join('');
  if (targetPlatform.toLowerCase().includes('tele')) {
    return post;
  }
  // default fallback
  return post;
}
