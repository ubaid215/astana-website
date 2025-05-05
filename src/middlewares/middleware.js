import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  console.log('[Middleware] Processing request:', pathname);

  // Skip middleware for public routes
  const publicRoutes = [
    '/admin/login',
    '/login',
    '/register',
    '/api/auth',
    '/api/auth/admin-login', // Allow admin login API
    '/_next',
    '/images',
    '/styles',
    '/uploads',
    '/socket.io'
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log('[Middleware] Bypassing middleware for public route:', pathname);
    return NextResponse.next();
  }

  console.log('[Middleware] Checking token for:', pathname);
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Handle admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    console.log('[Middleware] Admin route access check:', { pathname, isAdmin: token?.isAdmin });
    if (!token?.isAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      console.log('[Middleware] Redirecting to admin login:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Handle protected user routes
  const protectedUserRoutes = ['/admin', '/profile', '/participation', '/payment'];

  if (protectedUserRoutes.some((route) => pathname.startsWith(route))) {
    console.log('[Middleware] User route access check:', { pathname, hasToken: !!token });
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      console.log('[Middleware] Redirecting to user login:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
    // Prevent admin users from accessing user routes
    if (token.isAdmin) {
      console.log('[Middleware] Admin user attempting user route, redirecting to /admin');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Allow access to main website routes for unauthenticated users or users
  if (!token || !token.isAdmin) {
    console.log('[Middleware] Allowing access to main website route:', pathname);
    return NextResponse.next();
  }

  // Redirect authenticated admins away from main website routes
  console.log('[Middleware] Redirecting admin to /admin from:', pathname);
  return NextResponse.redirect(new URL('/admin', request.url));
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/participation/:path*',
    '/payment/:path*',
    '/((?!api|_next|images|styles|uploads|socket.io).*)'
  ]
};

// Debug log to confirm middleware is loaded
console.log('[Middleware] Middleware initialized with matchers:', config.matcher);