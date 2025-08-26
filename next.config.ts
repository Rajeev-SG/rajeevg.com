import type { NextConfig } from "next";

// Start Velite alongside Next.js in dev only (build runs via npm script)
const isDev = process.argv.includes("dev")
if (!process.env.VELITE_STARTED && isDev) {
  process.env.VELITE_STARTED = "1"
  import("velite")
    .then((m) => m.build({ watch: true, clean: false }))
    .catch((err) => console.error("Velite build failed:", err))
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Allow external images used in Tools cards
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
        // e.g. https://github.com/<user>/<repo>/raw/<branch>/**
        pathname: "/Rajeev-SG/gtm-site-speed/raw/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        // GitHub serves raw assets from this host after redirect
        pathname: "/Rajeev-SG/gtm-site-speed/**",
      },
    ],
  },
};

export default nextConfig;
