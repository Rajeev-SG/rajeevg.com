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
    return [
      // The Visual AI Lab is deployed as its own Vercel project and served under
      // this site's /interfaces route, so the lab keeps its own origin and assets.
      { source: "/interfaces/:path*", destination: "https://visual-ai-lab.vercel.app/:path*" },
    ]
  },
  outputFileTracingIncludes: {
    "/markdown-content": ["./content/posts/**/*.{md,mdx}"],
  },
};

export default nextConfig;
