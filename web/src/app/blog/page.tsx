import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Opstap | Tips voor solliciteren in Nederland',
  description: 'Praktische tips en gidsen over solliciteren, motivatiebrieven schrijven en vacatures vinden in Nederland.',
  openGraph: {
    title: 'Blog | Opstap',
    description: 'Praktische tips over solliciteren in Nederland.',
    url: 'https://opstapapp.nl/blog',
  },
}

const posts = [
  {
    slug: 'motivatiebrief-schrijven',
    title: 'Hoe schrijf je een sterke motivatiebrief in 2025?',
    description: 'Een goede motivatiebrief opent deuren. Leer wat recruiters verwachten en hoe je opvalt tussen honderden kandidaten.',
    date: '2025-06-01',
  },
  {
    slug: 'automatisch-solliciteren',
    title: 'Automatisch solliciteren: zo bespaar je uren per week',
    description: 'Met de juiste tools kun je tientallen sollicitaties versturen zonder elke brief opnieuw te schrijven. Zo werkt het.',
    date: '2025-06-03',
  },
  {
    slug: 'cv-tips-nederland',
    title: 'CV tips voor de Nederlandse arbeidsmarkt',
    description: 'Een Nederlands CV verschilt op cruciale punten van een internationaal CV. Vermijd de meest gemaakte fouten.',
    date: '2025-06-05',
  },
]

export default function BlogIndex() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      <nav className="flex items-center justify-between px-6 py-4 border-b max-w-4xl mx-auto" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <Link href="/" className="font-bold text-xl" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>
        <Link href="/register" className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: 'var(--color-indigo-primary)' }}>
          Aan de slag
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>Blog</h1>
        <p className="text-base mb-10" style={{ color: 'var(--color-text-muted)' }}>
          Tips en gidsen voor de Nederlandse arbeidsmarkt.
        </p>
        <div className="flex flex-col gap-6">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl p-6 transition hover:shadow-md"
              style={{ background: 'var(--color-lavender-card)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(post.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>{post.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
