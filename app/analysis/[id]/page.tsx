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
