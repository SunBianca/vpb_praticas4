// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        outDir: ".output/public",
        includeAssets: ["pwa-192.svg", "pwa-512.svg", "offline.html"],
        manifest: {
          name: "VPB Finanças",
          short_name: "VPB Finanças",
          description: "Painel financeiro VPB com agendamentos e contas.",
          lang: "pt-BR",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#0f0d14",
          background_color: "#0f0d14",
          icons: [
            {
              src: "/pwa-192.svg",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/pwa-512.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkFirst",
              options: {
                cacheName: "vpb-pages",
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
              handler: "NetworkFirst",
              options: {
                cacheName: "vpb-api",
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url, request }) =>
                url.origin === "https://vpb-praticas4.onrender.com" && request.method === "GET",
              handler: "NetworkFirst",
              options: {
                cacheName: "vpb-api",
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "vpb-fonts",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
