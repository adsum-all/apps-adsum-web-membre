import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // Broad target so the bundle parses on older mobile browsers (iOS Safari 12+,
    // Android Chrome 79+), which was a cause of the blank screen on some phones.
    target: ["es2019", "safari12", "chrome79", "firefox68", "edge79"],
  },
});
