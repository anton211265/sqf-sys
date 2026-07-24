import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react(), tsconfigPaths({ root: __dirname })],
    root: __dirname,
    envPrefix: ['VITE_'],
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // apps/web (the legacy Mantine app) owns 3001 — this runs alongside it
      // until cutover, per CLAUDE.md "Planned: Frontend Rebuild".
      port: 3003,
      strictPort: true,
      proxy: {
        '/trade-directory': 'http://localhost:80',
        '/risk-operation': 'http://localhost:80',
        '/customer-relationship-management': 'http://localhost:80',
        '/document-management': 'http://localhost:80',
        '/notification': 'http://localhost:80',
        '/knowledge-graph': 'http://localhost:80',
        '/product-configurator': 'http://localhost:80',
      },
    },
    build: {
      outDir: '../../dist/apps/customer-portal',
      emptyOutDir: true,
    },
    publicDir: 'public',
  };
});
