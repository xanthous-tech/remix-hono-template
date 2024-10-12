import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import toc from 'remark-toc';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  // build: {
  //   sourcemap: true,
  // },
  plugins: [
    tsconfigPaths(),
    devServer({
      entry: 'src/main.ts',
      injectClientScript: false,
      exclude: [/^\/(app)\/.+/, /^\/@.+$/, /^\/node_modules\/.*/],
    }),
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, toc],
    }),
    remix(),
  ],
});
