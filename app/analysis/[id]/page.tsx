import { store } from "../../../store/memory";
import { generate } from "../../server-actions";

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const rec = store.get(params.id);
  if (!rec) {
    return (
      <main>
        <p>Результат не найден или память процесса была очищена. Запустите анализ заново.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Дашборд</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Metric label="Платформа" value={/youtu/.test(rec.input) ? 'YouTube' : 'Текст'} />
          <Metric label="Длительность" value={formatDuration(rec.metrics?.durationSec)} />
          <Metric label="Сегменты" value={rec.metrics?.segmentCount ?? '—'} />
          <Metric label="Слова" value={rec.metrics?.wordCount ?? '—'} />
          <Metric label="Слов/мин" value={rec.metrics?.wordsPerMinute ?? '—'} />
        </div>
        {rec.metrics?.topKeywords?.length ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Топ‑ключевые слова</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {rec.metrics.topKeywords.map((k) => (
                <span key={k} style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#1e3a8a', padding: '2px 8px', borderRadius: 999 }}>{k}</span>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Входные данные</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 12, borderRadius: 8 }}>{rec.input}</pre>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Анализ (Markdown)</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>{rec.analysis}</pre>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Генерация поста</h2>
        <form action={generate} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="hidden" name="id" value={rec.id} />
          <input name="topic" placeholder="Новая тема (опционально)" style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 8 }} />
          <button type="submit" style={{ padding: '8px 12px', background: '#111', color: '#fff', borderRadius: 8 }}>Сгенерировать</button>
        </form>

        {rec.post && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Готовый пост</h3>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#eef2ff', padding: 12, borderRadius: 8 }}>{rec.post}</pre>
          </div>
        )}
      </section>
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
