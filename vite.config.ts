import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Explicitly expose only the client-safe Supabase values. Do not add a broad
  // SUPABASE_* env prefix: that would expose SUPABASE_SECRET_KEY to the browser.
  define: {
    "import.meta.env.SUPABASE_URL": JSON.stringify(process.env["SUPABASE_URL"]),
    "import.meta.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env["SUPABASE_PUBLISHABLE_KEY"],
    ),
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
