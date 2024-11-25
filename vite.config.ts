import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  // build: {
  //   sourcemap: true,
  // },
  plugins: [
    tsconfigPaths(),
    devServer({
      entry: 'server/main.ts',
      injectClientScript: false,
      exclude: [/^\/(app)\/.+/, /^\/@.+$/, /^\/node_modules\/.*/],
    }),
    reactRouter(),
  ],
});
