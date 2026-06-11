import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }
    const session = request.cookies.get('admin_session')?.value
    const adminKey = process.env.ADMIN_API_KEY
    if (!adminKey) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const expected = createHash('sha256').update(adminKey).digest('hex')
    if (session !== expected) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
