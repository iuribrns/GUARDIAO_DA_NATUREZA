import { defineConfig } from "vite";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  root,
  base: "./",
  publicDir: false,
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    fs: { deny: [".env", ".env.*", "**/.git/**", "**/.cache/**"] },
  },
  preview: { host: "0.0.0.0", port: 4173, strictPort: true },
  build: {
    outDir: "dist",
    assetsDir: "desenvolvimento/bundles",
    rolldownOptions: {
      input: resolve(root, "desenvolvimento/laboratorio/index.html"),
    },
  },
  plugins: [
    {
      name: "guardiao-paginas-existentes",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/") return next();
          response.writeHead(302, { Location: "/jogo/raizes/index.html" });
          response.end();
        });
      },
      async closeBundle() {
        // Manifesto do fluxo atual: as versões antigas continuam no Git, fora do site.
        const output = resolve(root, "dist");
        const manifest = JSON.parse(
          await readFile(
            resolve(root, "desenvolvimento/raizes/publicacao.json"),
            "utf8",
          ),
        );
        for (const file of manifest.files) {
          const destination = resolve(output, file);
          await mkdir(dirname(destination), { recursive: true });
          await cp(resolve(root, file), destination);
        }
      },
    },
  ],
});
