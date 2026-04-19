import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "Hakimi Plus",
        short_name: "Hakimi",
        description: "Votre boutique et épicerie en ligne",
        theme_color: "#800020",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/logo-512.png", // Le navigateur va réduire l'image tout seul
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable", // Ajoute une compatibilité maximale pour Android
          },
          {
            src: "/logo-512.png", // Ta vraie image HD
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
