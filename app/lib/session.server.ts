import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

import { auth } from '@/lib/auth';

// throws if there is no session
export async function validateSession({
  request,
  context,
}: LoaderFunctionArgs): Promise<void> {
  const { pathname } = new URL(request.url);

  if (!context.session) {
    throw redirect(`/signin?callbackUrl=${pathname}`);
  }
}

export async function signout({ request }: LoaderFunctionArgs): Promise<void> {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionId = auth.readSessionCookie(cookieHeader);

  if (sessionId) {
    await auth.invalidateSession(sessionId);
  }
}
