import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isStatic = process.env.VITE_STATIC === "1";

export default defineConfig({
  plugins: [react()],
  define: { __STATIC_PREVIEW__: JSON.stringify(isStatic) },
  resolve: {
    alias: [
      // Backend-free preview build swaps the API client for an in-browser shim.
      ...(isStatic ? [{ find: /^@\/lib\/api$/, replacement: path.resolve(__dirname, "src/lib/api.static.js") }] : []),
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  build: isStatic ? { outDir: "dist-static", assetsInlineLimit: 100000000, cssCodeSplit: false } : {},
  server: { port: 5173, proxy: { "/api": "http://localhost:8000" } },
});
