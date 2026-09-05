import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const nitroRenderer = join(
  dirname(require.resolve("nitro/package.json")),
  "dist/runtime/internal/vite/ssr-renderer.mjs",
);

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      renderer: {
        handler: nitroRenderer,
      },
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
