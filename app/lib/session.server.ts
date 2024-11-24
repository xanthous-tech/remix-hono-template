import { redirect } from 'react-router';

import { Route } from '@react-router-root-types/root';

import { auth } from '@/lib/auth';

// throws if there is no session
export async function validateSession({
  request,
  context,
}: Route.LoaderArgs): Promise<void> {
  const { pathname } = new URL(request.url);

  if (!context.session) {
    throw redirect(`/signin?callbackUrl=${pathname}`);
  }
}

export async function signout({ request }: Route.LoaderArgs): Promise<void> {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionId = auth.readSessionCookie(cookieHeader);

  if (sessionId) {
    await auth.invalidateSession(sessionId);
  }
}
