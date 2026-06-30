import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  title: 'Privacybeleid | Opstap',
  description: 'Hoe Opstap omgaat met je persoonsgegevens, CV en sollicitatie-informatie. AVG-conform, geen trackers.',
}

export default async function PrivacyPage() {
  const t = await getTranslations('PrivacyPage')

  const sections = [
    {
      id: 'wie',
      title: t('section1Title'),
      content: (
        <p>
          {t('section1Body').split('ons contactformulier')[0]}
          <a href="/contact" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            ons contactformulier
          </a>
          {t('section1Body').split('ons contactformulier')[1]?.split('privacy@opstapapp.nl')[0]}
          <strong>privacy@opstapapp.nl</strong>
          {t('section1Body').split('privacy@opstapapp.nl')[1]}
        </p>
      ),
    },
    {
      id: 'gegevens',
      title: t('section2Title'),
      content: (
        <>
          <p className="mb-3">{t('section2Intro')}</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>{t('section2Item1Label')}</strong>: {t('section2Item1Detail')}</li>
            <li><strong>{t('section2Item2Label')}</strong>: {t('section2Item2Detail')}</li>
            <li><strong>{t('section2Item3Label')}</strong>: {t('section2Item3Detail')}</li>
            <li><strong>{t('section2Item4Label')}</strong>: {t('section2Item4Detail')}</li>
            <li><strong>{t('section2Item5Label')}</strong>: {t('section2Item5Detail')}</li>
          </ul>
        </>
      ),
    },
    {
      id: 'doel',
      title: t('section3Title'),
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-lavender-card)' }}>
                <th className="text-left px-4 py-2.5 font-semibold rounded-tl-lg" style={{ color: 'var(--color-indigo-primary)' }}>{t('tableHeaderDoel')}</th>
                <th className="text-left px-4 py-2.5 font-semibold rounded-tr-lg" style={{ color: 'var(--color-indigo-primary)' }}>{t('tableHeaderGrondslag')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [t('tableRow1Doel'), t('tableRow1Grondslag')],
                [t('tableRow2Doel'), t('tableRow2Grondslag')],
                [t('tableRow3Doel'), t('tableRow3Grondslag')],
                [t('tableRow4Doel'), t('tableRow4Grondslag')],
                [t('tableRow5Doel'), t('tableRow5Grondslag')],
                [t('tableRow6Doel'), t('tableRow6Grondslag')],
              ].map(([doel, grondslag], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-lavender-card)' }}>
                  <td className="px-4 py-2.5">{doel}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{grondslag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'bewaartermijn',
      title: t('section4Title'),
      content: (
        <>
          <ul className="list-disc pl-5 flex flex-col gap-2 mb-4">
            <li><strong>CV-bestand</strong>: {t('section4CvItem')}</li>
            <li><strong>Profielgegevens en sollicitaties</strong>: {t('section4ProfileItem')}</li>
            <li><strong>Accountgegevens</strong>: {t('section4AccountItem')}</li>
          </ul>
          <p>{t('section4DeleteNote').split('Instellingen → CV verwijderen')[0]}<strong>Instellingen → CV verwijderen</strong>{t('section4DeleteNote').split('Instellingen → CV verwijderen')[1]?.split('Account verwijderen')[0]}<strong>Account verwijderen</strong>{t('section4DeleteNote').split('Account verwijderen')[1]}</p>
        </>
      ),
    },
    {
      id: 'derden',
      title: t('section5Title'),
      content: (
        <>
          <p className="mb-4">{t('section5NotShared').split('niet')[0]}<strong>niet</strong>{t('section5NotShared').split('niet')[1]}</p>
          <p className="mb-3">{t('section5ProcessorsIntro')}</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-lavender-card)' }}>
                  <th className="text-left px-4 py-2.5 font-semibold rounded-tl-lg" style={{ color: 'var(--color-indigo-primary)' }}>{t('tableHeaderVerwerker')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold rounded-tr-lg" style={{ color: 'var(--color-indigo-primary)' }}>{t('tableHeaderDoel')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [t('processorRow1Name'), t('processorRow1Doel')],
                  [t('processorRow2Name'), t('processorRow2Doel')],
                  [t('processorRow3Name'), t('processorRow3Doel')],
                  [t('processorRow4Name'), t('processorRow4Doel')],
                ].map(([verwerker, doel], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-lavender-card)' }}>
                    <td className="px-4 py-2.5 font-medium">{verwerker}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{doel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-3">{t('section5AnthropicNote').split('niet')[0]}<strong>niet</strong>{t('section5AnthropicNote').split('niet')[1]}</p>
          <p>{t('section5ContactNote').split('privacy@opstapapp.nl')[0]}<strong>privacy@opstapapp.nl</strong>{t('section5ContactNote').split('privacy@opstapapp.nl')[1]}</p>
        </>
      ),
    },
    {
      id: 'beveiliging',
      title: t('section6Title'),
      content: (
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>{t('section6Item1')}</li>
          <li>{t('section6Item2')}</li>
          <li>{t('section6Item3')}</li>
          <li>{t('section6Item4')}</li>
        </ul>
      ),
    },
    {
      id: 'rechten',
      title: t('section7Title'),
      content: (
        <>
          <p className="mb-3">{t('section7Intro')}</p>
          <ul className="list-disc pl-5 flex flex-col gap-2 mb-4">
            <li><strong>{t('section7Right1Label')}</strong> {t('section7Right1Detail')}</li>
            <li><strong>{t('section7Right2Label')}</strong> {t('section7Right2Detail')}</li>
            <li><strong>{t('section7Right3Label')}</strong> {t('section7Right3Detail')}</li>
            <li><strong>{t('section7Right4Label')}</strong> {t('section7Right4Detail')}</li>
            <li><strong>{t('section7Right5Label')}</strong> {t('section7Right5Detail')}</li>
            <li><strong>{t('section7Right6Label')}</strong>: {t('section7Right6Detail').split('autoriteitpersoonsgegevens.nl')[0]}<a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>autoriteitpersoonsgegevens.nl</a>{t('section7Right6Detail').split('autoriteitpersoonsgegevens.nl')[1]}</li>
          </ul>
          <p>{t('section7ContactNote').split('privacy@opstapapp.nl')[0]}<strong>privacy@opstapapp.nl</strong>{t('section7ContactNote').split('privacy@opstapapp.nl')[1]}</p>
        </>
      ),
    },
    {
      id: 'cookies',
      title: t('section8Title'),
      content: (
        <>
          <p className="mb-3">
            {t('section8NoCookies').split('geen')[0]}<strong>geen</strong>{t('section8NoCookies').split('geen')[1]}
          </p>
          <p className="mb-3">
            {t('section8PostHog').split('PostHog')[0]}<strong>PostHog</strong>{t('section8PostHog').split('PostHog')[1]}
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>{t('section8CookieItem1').split('alleen geactiveerd')[0]}<strong>alleen geactiveerd</strong>{t('section8CookieItem1').split('alleen geactiveerd')[1]}</li>
            <li>{t('section8CookieItem2').split('niets')[0]}<strong>niets</strong>{t('section8CookieItem2').split('niets')[1]}</li>
            <li>{t('section8CookieItem3')}</li>
            <li>{t('section8CookieItem4')}</li>
          </ul>
        </>
      ),
    },
    {
      id: 'ai',
      title: t('section9Title'),
      content: (
        <p>{t('section9Body').split('ondersteunende')[0]}<strong>ondersteunende</strong>{t('section9Body').split('ondersteunende')[1]}</p>
      ),
    },
    {
      id: 'wijzigingen',
      title: t('section10Title'),
      content: (
        <p>{t('section10Body')}</p>
      ),
    },
    {
      id: 'contact-privacy',
      title: t('section11Title'),
      content: (
        <>
          <p className="mb-2">{t('section11Intro')}</p>
          <p><strong>{t('section11Email')}</strong>: {t('section11EmailValue')}</p>
          <p><strong>{t('section11Company')}</strong></p>
        </>
      ),
    },
  ]

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('pageTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('lastUpdate')}
          </p>
        </div>

        <nav className="rounded-2xl p-5 mb-12" style={{ background: 'var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('tocHeading')}
          </p>
          <ol className="flex flex-col gap-1.5">
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-10">
          {sections.map(s => (
            <section key={s.id} id={s.id}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
                {s.title}
              </h2>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {s.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 flex gap-6 text-sm" style={{ borderTop: '1px solid var(--color-lavender-card)', color: 'var(--color-text-muted)' }}>
          <Link href="/contact" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>{t('footerContact')}</Link>
          <Link href="/faq" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>{t('footerHelpFaq')}</Link>
          <Link href="/" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>{t('footerBackHome')}</Link>
        </div>

      </div>
    </PublicShell>
  )
}
