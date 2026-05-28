import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// Pure CSR (Client-Side Rendered) Vite config.
// No SSR, no TanStack Start, no server rendering pipeline.
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      routeFileIgnorePattern: "^\\.",
      quoteStyle: "single",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: true },
    }),
  ],

  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    sourcemap: true,
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["@tanstack/react-router"],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "ui-vendor": ["lucide-react", "sonner"],
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
