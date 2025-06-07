
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestUrl = request.url;
  console.log(`[Middleware] === Request Start ===`);
  console.log(`[Middleware] Request URL: ${requestUrl}`);
  console.log(`[Middleware] Pathname: ${pathname}`);

  const isLoggedInCookieValue = request.cookies.get('isLoggedIn')?.value;
  const isLoggedIn = isLoggedInCookieValue === 'true'; // Check cookie directly
  const userDisplayNameCookie = request.cookies.get('userDisplayName')?.value;
  const userDisplayName = userDisplayNameCookie ? decodeURIComponent(userDisplayNameCookie) : null;
  
  console.log(`[Middleware] Read isLoggedIn cookie value: "${isLoggedInCookieValue}" -> Evaluated isLoggedIn: ${isLoggedIn}`);
  
  // Log user activity for logged-in users
  if (isLoggedIn && userDisplayName) {
    console.log(`[Middleware] 🎯 LOGGED-IN USER ACTIVITY: "${userDisplayName}" visited route: ${pathname}`);
  } else if (isLoggedIn && !userDisplayName) {
    console.log(`[Middleware] 🎯 LOGGED-IN USER ACTIVITY: [Unknown User] visited route: ${pathname}`);
  }

  const protectedRoutes = ['/dashboard', '/profile', '/log', '/report', '/history', '/settings', '/log-exercise'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  console.log(`[Middleware] Is Protected Route? ${isProtectedRoute}`);

  // --- Simplified Logic ---

  // 1. If accessing a protected route AND NOT logged in -> Redirect to /authorize
  if (isProtectedRoute && !isLoggedIn) {
    const authorizeUrl = new URL('/authorize', request.url);
    console.log(`[Middleware] DECISION (1): Not logged in, accessing protected route ${pathname}. REDIRECTING to ${authorizeUrl.toString()}`);
    console.log(`[Middleware] === Request End ===`);
    return NextResponse.redirect(authorizeUrl);
  }

  // 2. If accessing /authorize AND IS logged in -> Redirect to /dashboard
  if (pathname === '/authorize' && isLoggedIn) {
    const dashboardUrl = new URL('/dashboard', request.url);
    console.log(`[Middleware] DECISION (2): Logged in, accessing ${pathname}. REDIRECTING to ${dashboardUrl.toString()}`);
    console.log(`[Middleware] === Request End ===`);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. If accessing root path '/' AND IS logged in -> Redirect to /dashboard
   if (pathname === '/' && isLoggedIn) {
       const dashboardUrl = new URL('/dashboard', request.url);
       console.log(`[Middleware] DECISION (3): Logged in user accessing root /. REDIRECTING to ${dashboardUrl.toString()}`);
       console.log(`[Middleware] === Request End ===`);
       return NextResponse.redirect(dashboardUrl);
   }

  // 4. Allow all other requests (logged-in accessing protected/public, logged-out accessing public non-login/root)
  console.log(`[Middleware] DECISION (4 - Default): Allowing request for ${pathname}. (NextResponse.next())`);
  console.log(`[Middleware] === Request End ===`);
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
