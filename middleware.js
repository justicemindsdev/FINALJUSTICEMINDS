import { NextResponse } from 'next/server';
import { routeConfig, ROUTE_TYPES } from './lib/authUtils';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get route configuration or default to protected
  const route = routeConfig[pathname] || { type: ROUTE_TYPES.PROTECTED };
  
  // Get access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!accessToken;

  // Handle different route types
  switch (route.type) {
    case ROUTE_TYPES.PUBLIC:
      // Public routes are accessible to everyone
      return NextResponse.next();

    case ROUTE_TYPES.AUTH:
      // Auth routes (like login) are only for non-authenticated users
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();

    case ROUTE_TYPES.PROTECTED:
      // Protected routes require authentication
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      return NextResponse.next();

    default:
      return NextResponse.next();
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
