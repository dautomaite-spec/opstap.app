import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

const siteUrl = 'https://opstapapp.nl'

export const metadata: Metadata = {
  title: 'Opstap — Meer kansen. Minder moeite.',
  description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Opstap — Meer kansen. Minder moeite.',
    description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
    url: siteUrl,
    siteName: 'Opstap',
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Opstap — Meer kansen. Minder moeite.',
    description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const themeScript = `
(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();
`.trim()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <Script
            id="posthog-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||(window.posthog=[]));
posthog.init("${process.env.NEXT_PUBLIC_POSTHOG_KEY}", {
  api_host: "https://eu.i.posthog.com",
  person_profiles: "identified_only"
});
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
