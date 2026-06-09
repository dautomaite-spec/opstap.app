import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/dashboard/settings'],
    },
    sitemap: 'https://opstapapp.nl/sitemap.xml',
  }
}
