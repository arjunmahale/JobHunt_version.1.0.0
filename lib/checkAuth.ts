import { cookies } from 'next/headers';

export async function verifyAuthServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return { isAuthenticated: false, token: null };
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return { isAuthenticated: true, token };
    }
  } catch (error) {
    return { isAuthenticated: false, token: null };
  }

  return { isAuthenticated: false, token: null };
}