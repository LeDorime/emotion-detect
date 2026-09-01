import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // The face-api / TensorFlow.js bundle is large but lazy-loaded on its own
    // chunk (see src/lib/emotionModel.ts), so it never blocks first paint.
    chunkSizeWarningLimit: 1500,
  },
});
