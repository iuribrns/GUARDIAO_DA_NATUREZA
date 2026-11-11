import { defineConfig } from "vite";
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
    fs: {
      deny: [".env", ".env.*", "**/.git/**", "**/.cache/**", "**/arquivo/**"],
    },
  },
  preview: { host: "0.0.0.0", port: 4173, strictPort: true },
  plugins: [
    {
      name: "entrada-do-jogo",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/") return next();
          response.writeHead(302, { Location: "/jogo/viva/index.html" });
          response.end();
        });
      },
    },
  ],
});
