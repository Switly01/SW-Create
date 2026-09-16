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
        en: resolve(__dirname, "en/index.html"),
        de: resolve(__dirname, "de/index.html"),
        es: resolve(__dirname, "es/index.html"),
        fr: resolve(__dirname, "fr/index.html"),
        ru: resolve(__dirname, "ru/index.html"),
        ar: resolve(__dirname, "ar/index.html"),
        ja: resolve(__dirname, "ja/index.html"),
        account: resolve(__dirname, "account/index.html"),
        home: resolve(__dirname, "home/index.html"),
        center: resolve(__dirname, "center/index.html"),
        dashboard: resolve(__dirname, "dashboard/index.html"),
        plans: resolve(__dirname, "plans/index.html"),
        updates: resolve(__dirname, "updates/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        terms: resolve(__dirname, "terms/index.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
});
