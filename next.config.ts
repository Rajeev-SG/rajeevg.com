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
    // The AI discovery observation plane is its own deployment (repo:
    // Rajeev-SG/ai-discovery-intelligence, web/ root, built with
    // BASE_PATH=/solutions/ai-discovery). Proxied here so the product lives on
    // the main domain while the two codebases deploy independently. Override
    // the target with AI_DISCOVERY_ORIGIN for local development.
    const aiDiscoveryOrigin =
      process.env.AI_DISCOVERY_ORIGIN ??
      "https://ai-discovery-observation-plane-rajeevgills-projects.vercel.app"

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
    return {
      // beforeFiles: the whole subtree belongs to the origin app; this must win
      // over the host's own /solutions/[slug] route before filesystem matching.
      beforeFiles: [
        {
          source: "/solutions/ai-discovery",
          destination: `${aiDiscoveryOrigin}/solutions/ai-discovery`,
        },
        {
          source: "/solutions/ai-discovery/:path*",
          destination: `${aiDiscoveryOrigin}/solutions/ai-discovery/:path*`,
        },
      ],
      // afterFiles: the lab is a separate application with no routes of its own
      // on this site, so it is proxied once the filesystem has been checked.
      afterFiles: [
        { source: "/interfaces", destination: "https://visual-ai-lab.vercel.app/" },
        { source: "/interfaces/:path*", destination: "https://visual-ai-lab.vercel.app/:path*" },
      ],
    }
  },
  outputFileTracingIncludes: {
    "/markdown-content": ["./content/posts/**/*.{md,mdx}"],
  },
};

export default nextConfig;
