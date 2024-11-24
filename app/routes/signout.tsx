import { redirect } from 'react-router';

import { Route } from '@react-router-route-types/signout';

import { signout } from '~/lib/session.server';

export const loader = async (args: Route.LoaderArgs) => {
  await signout(args);
  return redirect('/signin');
};
