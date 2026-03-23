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
  async rewrites() {
    const sgtmUpstreamOrigin = process.env.SGTM_UPSTREAM_ORIGIN

    if (!sgtmUpstreamOrigin) {
      return []
    }

    const upstreamOrigin = sgtmUpstreamOrigin.endsWith("/")
      ? sgtmUpstreamOrigin.slice(0, -1)
      : sgtmUpstreamOrigin

    return [
      {
        source: "/metrics/:path*",
        destination: `${upstreamOrigin}/:path*`,
      },
    ]
  },
};

export default nextConfig;
