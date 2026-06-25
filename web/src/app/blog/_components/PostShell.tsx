import Link from 'next/link'

export default function PostShell({ children }: { children: React.ReactNode }) {
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
        <article className="prose prose-slate max-w-none">
          {children}
        </article>
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <Link href="/blog" className="text-sm hover:underline" style={{ color: 'var(--color-text-muted)' }}>
            &larr; Terug naar blog
          </Link>
        </div>
      </main>
    </div>
  )
}
