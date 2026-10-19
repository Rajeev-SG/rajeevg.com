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
  // mermaid-isomorphic must stay a real Node require: bundling it breaks
  // `path.resolve` ({} shim) during page-data collection.
  serverExternalPackages: ["mermaid-isomorphic", "rehype-mermaid"],
  async rewrites() {
    // The Visual AI Lab is deployed as its own Vercel project and served under
    // this site's /interfaces route, so the lab keeps its own origin and assets.
    //
    // The exact "/interfaces" rule exists because ":path*" does not match the
    // bare prefix in every Next version, and the trailing-slash form is the one
    // the sitemap and the nav link point at.
    //
    // Trust model: this proxy puts the lab's JavaScript on rajeevg.com's
    // origin. The lab is a project owned by the same account, and it is served
    // under this site's path with no cookies of its own, but its scripts run
    // same-origin with this site's session. See docs/interfaces-lab.md for the
    // blast radius and the guardrails.
    return [
      { source: "/interfaces", destination: "https://visual-ai-lab.vercel.app/" },
      { source: "/interfaces/:path*", destination: "https://visual-ai-lab.vercel.app/:path*" },
    ]
  },
  outputFileTracingIncludes: {
    "/markdown-content": ["./content/posts/**/*.{md,mdx}"],
  },
};

export default nextConfig;
