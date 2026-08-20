import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('medflow_auth_token')?.value
  const { pathname } = request.nextUrl
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  
  if (!token && !isAuthPage) {
    if (pathname.startsWith('/patient') || pathname.startsWith('/clinician') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  if (token && isAuthPage) {
    // Basic redirect, ideally parse JWT to get role for precise redirect
    // Falling back to /patient/dashboard for now
    return NextResponse.redirect(new URL('/patient/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
