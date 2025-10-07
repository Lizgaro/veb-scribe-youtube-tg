"use client";
import { useFormState } from "react-dom";
import { analyzeInline, generatePostWithLLM, type AnalyzeState, type GenerateState } from "./server-actions";

const initialAnalyze: AnalyzeState = { ok: false };
const initialGenerate: GenerateState = { ok: false };

export default function Home() {
  const [aState, analyzeAction] = useFormState(analyzeInline, initialAnalyze);
  const [gState, generateAction] = useFormState(generatePostWithLLM, initialGenerate);

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <form action={analyzeAction} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="input" style={{ fontWeight: 600 }}>Текст или ссылка (YouTube)</label>
        <textarea id="input" name="input" required rows={8} placeholder="Вставьте текст для анализа или URL..."
          style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8 }}>Запустить анализ</button>
        {aState.error && <div style={{ color: '#b91c1c' }}>{aState.error}</div>}
      </form>

      {aState.ok && aState.analysis && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Дашборд</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Metric label="Платформа" value={/youtu/.test(aState.input || '') ? 'YouTube' : 'Текст'} />
            <Metric label="Длительность" value={formatDuration(aState.metrics?.durationSec)} />
            <Metric label="Сегменты" value={aState.metrics?.segmentCount ?? '—'} />
            <Metric label="Слова" value={aState.metrics?.wordCount ?? '—'} />
            <Metric label="Слов/мин" value={aState.metrics?.wordsPerMinute ?? '—'} />
          </div>
          {aState.metrics?.topKeywords?.length ? (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Топ‑ключевые слова</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {aState.metrics.topKeywords.map((k) => (
                  <span key={k} style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#1e3a8a', padding: '2px 8px', borderRadius: 999 }}>{k}</span>
                ))}
              </div>
            </div>
          ) : null}

          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Анализ (Markdown)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>{aState.analysis}</pre>

          <form action={generateAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="transcript" value={aState.transcriptText} />
            <input type="hidden" name="title" value={aState.title} />
            <input type="hidden" name="description" value={aState.description} />
            <input name="topic" placeholder="Новая тема (опционально)" style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 8 }} />
            <button type="submit" style={{ padding: '8px 12px', background: '#111', color: '#fff', borderRadius: 8 }}>Сгенерировать</button>
          </form>
          {gState.error && <div style={{ color: '#b91c1c' }} data-testid="error-message">{gState.error}</div>}
          {gState.ok && gState.post && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Готовый пост</h3>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#eef2ff', padding: 12, borderRadius: 8 }}>{gState.post}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{value ?? '—'}</div>
    </div>
  );
}

function formatDuration(sec?: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}