import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunction, type MetaFunction } from '@remix-run/node';

import { Button } from '~/components/ui/button';
import { GitHubIcon } from '~/components/icons/github';
import { AppleIcon } from '~/components/icons/apple';

import { createCallbackUrlCookie } from '@/lib/auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign in' },
    { name: 'description', content: 'Remix Express Template' },
  ];
};

export const loader: LoaderFunction = async ({ request, context }) => {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const cookie = createCallbackUrlCookie(callbackUrl);

  return json(
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
    <div className='m-4'>
      <h2 className='text-xl font-bold my-2'>Login</h2>
      <Button asChild>
        <a href='/api/auth/github/login'>
          <GitHubIcon className='mr-2 h-4 w-4' />
          通过GitHub登录
        </a>
      </Button>
      <p>或</p>
      <Button asChild>
        <a href='/api/auth/apple/login'>
          <AppleIcon className='mr-2 h-4 w-4' />
          Sign in with Apple
        </a>
      </Button>
    </div>
  );
}
