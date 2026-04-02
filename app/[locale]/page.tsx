export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page">
      <h1 className="text-4xl font-semibold text-primary">
        Rumbo
      </h1>
      <p className="mt-4 text-text-secondary">
        PWA para turistas del Mundial FIFA 2026
      </p>
      {/* Test con color inline */}
      <div className="mt-4 p-4 rounded" style={{backgroundColor: '#0891B2', color: 'white'}}>
        Si esto es cian, Tailwind base funciona
      </div>
      <div className="mt-8 flex gap-4">
        <span className="px-4 py-2 bg-primary text-white rounded-full text-sm">
          Primario
        </span>
        <span className="px-4 py-2 bg-accent text-white rounded-full text-sm">
          Acento
        </span>
        <span className="px-4 py-2 bg-surface text-text-main rounded-full text-sm">
          Superficie
        </span>
      </div>
    </main>
  );
}