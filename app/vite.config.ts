import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "AgroIntel",
        short_name: "AgroIntel",
        description: "Your digital farming co-pilot",
        theme_color: "#008751",
        background_color: "#f6f7f2",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: {
        // Offline support: keep the last weather, crop guides and farm data on the device.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\/v1\/(weather|crops|diseases|farms|alerts)/.test(url.pathname),
            handler: "NetworkFirst",
            options: { cacheName: "api", networkTimeoutSeconds: 5, expiration: { maxEntries: 100, maxAgeSeconds: 7 * 86400 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/uploads/"),
            handler: "CacheFirst",
            options: { cacheName: "images", expiration: { maxEntries: 200, maxAgeSeconds: 30 * 86400 } },
          },
        ],
      },
    }),
  ],
});
