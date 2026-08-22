import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { verifySessionJWT, getCookieName } from './lib/auth';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // 1. Handle Admin Routes
  if (url.pathname.startsWith('/admin')) {
    // Exclude /admin/login from auth check
    if (url.pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    const sessionCookie = request.cookies.get(getCookieName());
    const secret = process.env.SESSION_SECRET;

    if (!sessionCookie || !secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const isValid = await verifySessionJWT(sessionCookie.value, secret);
    if (!isValid) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete(getCookieName());
      return response;
    }
    
    return NextResponse.next();
  }

  // 2. Handle all other routes with next-intl
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for API routes, _next folders, and files with extensions
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
