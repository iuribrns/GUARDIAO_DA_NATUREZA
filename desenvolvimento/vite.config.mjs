import { defineConfig } from 'vite';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  server: { host: '0.0.0.0', port: 5173, strictPort: true, fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.cache/**'] } },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: {
    outDir: 'dist',
    assetsDir: 'desenvolvimento/bundles',
    rolldownOptions: { input: resolve(root, 'desenvolvimento/laboratorio/index.html') }
  },
  plugins: [{
    name: 'guardiao-paginas-existentes',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/') return next();
        response.writeHead(302, { Location: '/tela-inicial/nova-versao/index.html' });
        response.end();
      });
    },
    async closeBundle() {
      // Copia apenas as pastas públicas conhecidas. Nunca publica .git, caches
      // ou node_modules. Os scripts clássicos das telas continuam intactos.
      const output = resolve(root, 'dist');
      for (const folder of ['assets', 'tela-inicial', 'jogo', 'desenvolvimento/modelos']) {
        await mkdir(resolve(output, folder), { recursive: true });
        await cp(resolve(root, folder), resolve(output, folder), { recursive: true });
      }
      await writeFile(resolve(output, 'index.html'), await readFile(resolve(root, 'index.html')));
      await cp(resolve(root, '.nojekyll'), resolve(output, '.nojekyll'));
    }
  }]
});
