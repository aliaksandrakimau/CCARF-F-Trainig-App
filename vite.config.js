import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on any host, including GitHub Pages subpaths.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
