import { NextRequest } from 'next/server';

type LoginResult = { success: true; token: string } | { success: false; error: string };

export function createAdminToken(email: string, password: string) {
  return Buffer.from(`${email}:${password}`).toString('base64');
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  // Simple auth - in production, use proper authentication
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return { success: false, error: 'Admin credentials are not configured.' };
  }

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return { success: true, token: createAdminToken(email, password) };
  }

  return { success: false, error: 'Invalid credentials' };
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    return email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return false;
  }

  return verifyAdminToken(token);
}

export function getAutomationBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return request.headers.get('x-automation-secret');
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : authorization;
}

export function isAutomationRequestAuthorized(request: NextRequest) {
  const expectedSecret = process.env.AUTOMATION_API_SECRET;
  if (!expectedSecret) {
    return false;
  }

  return getAutomationBearerToken(request) === expectedSecret;
}

export function getAdminCookie() {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const adminCookie = cookies.find((cookie) => cookie.trim().startsWith('admin_token='));
  return adminCookie ? adminCookie.split('=')[1] : null;
}
