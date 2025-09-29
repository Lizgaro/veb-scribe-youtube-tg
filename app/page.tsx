import { analyze } from "./server-actions";

export default function Home() {
  return (
    <main>
      <form action={analyze} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="input" style={{ fontWeight: 600 }}>Текст или ссылка (YouTube/Telegram)</label>
        <textarea id="input" name="input" required rows={8} placeholder="Вставьте текст для анализа или URL..."
          style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8 }}>Запустить анализ</button>
      </form>
    </main>
  );
}
