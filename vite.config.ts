import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        account: resolve(__dirname, "account/index.html"),
        home: resolve(__dirname, "home/index.html"),
        center: resolve(__dirname, "center/index.html"),
        dashboard: resolve(__dirname, "dashboard/index.html"),
        plans: resolve(__dirname, "plans/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        terms: resolve(__dirname, "terms/index.html"),
      },
    },
  },
});
