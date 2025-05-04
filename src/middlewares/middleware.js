import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // Skip middleware for public routes
  const publicRoutes = [
    '/admin/login',
    '/login',
    '/register',
    '/api/auth',
    '/_next',
    '/images',
    '/styles',
    '/uploads',
    '/socket.io'
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Handle admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token?.isAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle protected user routes
  const protectedUserRoutes = [
    '/profile',
    '/participation',
    '/payment'
  ];

  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/profile/:path*',
    '/participation/:path*',
    '/payment/:path*'
  ],
};