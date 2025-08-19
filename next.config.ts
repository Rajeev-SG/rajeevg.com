import type { NextConfig } from "next";

// Start Velite alongside Next.js in dev/build
const isDev = process.argv.includes("dev")
const isBuild = process.argv.includes("build")
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1"
  import("velite")
    .then((m) => m.build({ watch: isDev, clean: !isDev }))
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
