import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  
  // Advanced PWA options
  fallbacks: {
    document: "/offline",
  },
  
  // Cache strategies - using string patterns for compatibility
  runtimeCaching: [
    {
      // Cache API calls with network-first strategy
      urlPattern: "https://sgp\\.cloud\\.appwrite\\.io/.*",
      handler: "NetworkFirst",
      options: {
        cacheName: "appwrite-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // Cache images with cache-first strategy
      urlPattern: ".*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$",
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Cache fonts with cache-first strategy
      urlPattern: ".*\\.(?:woff|woff2|ttf|otf|eot)$",
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      // Cache JS/CSS with stale-while-revalidate
      urlPattern: ".*\\.(?:js|css)$",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      // Cache Google Fonts
      urlPattern: "https://fonts\\.(?:googleapis|gstatic)\\.com/.*",
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {}, // Empty turbopack config to silence the warning
};

export default withPWA(nextConfig);
