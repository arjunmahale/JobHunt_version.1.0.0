import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin')) {
    // Allow login page (check without query string)
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.next();
    }

    // Check for valid admin token
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      // Redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token validity
    try {
      const decoded = Buffer.from(adminToken, 'base64').toString('utf-8');
      const [email, password] = decoded.split(':');

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email !== adminEmail || password !== adminPassword) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// This config is REQUIRED for middleware to work
export const config = {
  matcher: ['/admin', '/admin/:path*'],
};