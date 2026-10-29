import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
  },
  build: {
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: [],
    esbuildOptions: {
      target: "es2020",
    },
    include: ["exponential-backoff"],
  },
  resolve: {
    alias: {
      // Fix for protobuf issues
      "google-protobuf": "google-protobuf/google-protobuf.js",
    },
  },
});
