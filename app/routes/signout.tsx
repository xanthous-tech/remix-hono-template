import { redirect } from 'react-router';

import { signout } from '~/lib/session.server';

export const loader = async (args) => {
  await signout(args);
  return redirect('/signin');
};
