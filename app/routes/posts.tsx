import { json, LoaderFunction } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import type { Frontmatter } from '~/lib/posts.server';

export const loader: LoaderFunction = async ({ request, params, context }) => {
  const pathname = new URL(request.url).pathname;
  const posts = import.meta.glob<{ frontmatter: Frontmatter }>('./posts.*.mdx');

  const filename = `./posts.${pathname.split('/').slice(2).join('.')}.mdx`;

  for (const [file, post] of Object.entries(posts)) {
    if (file === filename) {
      const { frontmatter } = await post();
      return json({ frontmatter });
    }
  }
};

export default function Component() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="p-10 max-w-full prose">
      <h1>{data.frontmatter.title}</h1>
      <div>{data.frontmatter.published}</div>
      <Outlet />
    </div>
  );
}
