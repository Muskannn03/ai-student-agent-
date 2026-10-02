import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/token';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
