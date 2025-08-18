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
};

export default nextConfig;
