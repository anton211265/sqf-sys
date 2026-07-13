import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tsconfigPaths({ root: __dirname }),
    ],
    root: __dirname,
    // Vite's own env loading exposes any .env var with one of these prefixes
    // via import.meta.env.X — in both dev and build, unlike a custom `define`
    // block, which esbuild/Rollup only apply at build time, not in `vite dev`.
    // REACT_APP_ is kept for source carried over from the old CRA setup;
    // process.env.REACT_APP_X access is polyfilled in src/process-env-shim.ts.
    envPrefix: ['VITE_', 'REACT_APP_'],
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3001,
      strictPort: true,
      proxy: {
        '/trade-directory': 'http://localhost:80',
        '/risk-operation': 'http://localhost:80',
        '/customer-relationship-management': 'http://localhost:80',
        '/document-management': 'http://localhost:80',
        '/notification': 'http://localhost:80',
        '/knowledge-graph': 'http://localhost:80',
      },
    },
    build: {
      outDir: '../../dist/apps/web',
      emptyOutDir: true,
    },
    publicDir: 'public',
  };
});
