import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        format: "es",
      },
    },
  },
});
