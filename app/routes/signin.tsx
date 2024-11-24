import { data, useLoaderData } from 'react-router';

import { Route } from '@react-router-route-types/signin';

import { Button } from '@shared/components/ui/button';
import { GitHubIcon } from '@shared/components/icons/github';
import { AppleIcon } from '@shared/components/icons/apple';

import { createCallbackUrlCookie } from '@/lib/auth';

export const meta = () => {
  return [
    { title: 'Sign in' },
    { name: 'description', content: 'Remix Express Template' },
  ];
};

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const cookie = createCallbackUrlCookie(callbackUrl);

  return data(
    {
      callbackUrl,
    },
    {
      headers: {
        'Set-Cookie': cookie.serialize(),
      },
    },
  );
};

export default function SignInPage() {
  const { callbackUrl } = useLoaderData<typeof loader>();

  return (
    <div className="m-4">
      <h2 className="text-xl font-bold my-2">Login</h2>
      <Button asChild>
        <a href="/api/auth/github/login">
          <GitHubIcon className="mr-2 h-4 w-4" />
          通过GitHub登录
        </a>
      </Button>
      <p>或</p>
      <Button asChild>
        <a href="/api/auth/apple/login">
          <AppleIcon className="mr-2 h-4 w-4" />
          Sign in with Apple
        </a>
      </Button>
    </div>
  );
}
