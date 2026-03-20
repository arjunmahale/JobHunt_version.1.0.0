type LoginResult = { success: true; token: string } | { success: false; error: string };

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  // Simple auth - in production, use proper authentication
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    return { success: true, token };
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

export function getAdminCookie() {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const adminCookie = cookies.find(c => c.trim().startsWith('admin_token='));
  return adminCookie ? adminCookie.split('=')[1] : null;
}