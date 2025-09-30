export const metadata = {
  title: "AI Content Analyzer MVP",
  description: "Минимальный прототип без внешних зависимостей",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 880, margin: '0 auto', lineHeight: 1.5 }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Content Analyzer — MVP</h1>
          <p style={{ color: '#555' }}>Вставь текст или ссылку — получи анализ. Без БД и внешних API.</p>
        </header>
        {children}
        <footer style={{ marginTop: 40, color: '#777', fontSize: 12 }}>
          Прототип. Данные хранятся в памяти процесса и сбрасываются при перезагрузке.
        </footer>
      </body>
    </html>
  );
}
