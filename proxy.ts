import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /robots.txt (static files)
     */
    '/((?!login|api/auth|api/cron|_next|favicon.ico|robots.txt).*)',
  ],
}
