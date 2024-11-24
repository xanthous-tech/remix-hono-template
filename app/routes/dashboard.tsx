import { useLoaderData } from 'react-router';

import { Route } from '@react-router-route-types/dashboard';

import { validateSession } from '~/lib/session.server';
import { useUser } from '~/lib/hooks';

export const meta = () => {
  return [
    { title: 'Remix Express Template' },
    { name: 'description', content: 'Remix Express Template' },
  ];
};

export const loader = async (args: Route.LoaderArgs) => {
  await validateSession(args);

  return {
    user: args.context.user,
  };
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const user = useUser('1');

  return (
    <div className="m-4">
      <h2 className="text-xl font-bold my-2">Remix Express Template</h2>
      <p>
        You are logged in as {data.user?.name}. {user?.data?.name}
      </p>
      <p>
        <a href="/signout" className="underline">
          Sign out here
        </a>
      </p>
    </div>
  );
}
