import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-bold text-xl" style={{ color: 'var(--color-indigo-primary)' }}>Opstap</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg transition hover:bg-white" style={{ color: 'var(--color-indigo-primary)' }}>
            Inloggen
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-white transition hover:opacity-90" style={{ background: 'var(--color-indigo-primary)' }}>
            Gratis starten
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-5xl font-bold leading-tight max-w-2xl" style={{ color: 'var(--color-indigo-primary)' }}>
          Meer kansen.<br />Minder moeite.
        </h1>
        <p className="mt-6 text-lg max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
          Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en ontvang een persoonlijke motivatiebrief — geschreven door AI, goedgekeurd door jou.
        </p>
        <div className="mt-10 flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="px-8 py-3 text-base font-semibold rounded-xl text-white shadow-md transition hover:opacity-90" style={{ background: 'var(--color-indigo-primary)' }}>
            Begin gratis
          </Link>
          <Link href="/login" className="px-8 py-3 text-base font-semibold rounded-xl border transition hover:bg-white" style={{ color: 'var(--color-indigo-primary)', borderColor: 'var(--color-indigo-primary)' }}>
            Inloggen
          </Link>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📄', title: 'Upload je CV', desc: 'Of vul je profiel handmatig in. Opstap onthoudt alles — één keer invoeren.' },
            { icon: '🔍', title: 'Vind vacatures', desc: 'We doorzoeken de grootste Nederlandse jobboards en tonen alleen de vacatures die bij jou passen.' },
            { icon: '✉️', title: 'Solliciteer automatisch', desc: 'AI schrijft per vacature een persoonlijke motivatiebrief. Jij keurt goed — wij versturen.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-6" style={{ background: 'var(--color-lavender-card)' }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-indigo-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        © {new Date().getFullYear()} Opstap &middot;{' '}
        <Link href="/privacy" className="underline">Privacybeleid</Link>
      </footer>
    </main>
  )
}
