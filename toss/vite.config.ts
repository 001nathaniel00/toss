import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths, so the build works on any static host or sub-path
  // (e.g. GitHub Pages project sites at https://user.github.io/repo/).
  base: "./",
  plugins: [react()],
});
