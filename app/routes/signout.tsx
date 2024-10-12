import { LoaderFunction, redirect } from '@remix-run/node';

import { signout } from '~/lib/session.server';

export const loader: LoaderFunction = async (args) => {
  await signout(args);
  return redirect('/signin');
};
