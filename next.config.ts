import { createHash } from "node:crypto";
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
  // Which build is live, captured at build time. The deploy-time proof for the
  // /interfaces route has to show that the production alias is serving the
  // commit that was just pushed, and the runtime environment does not carry
  // the commit. Vercel sets VERCEL_GIT_COMMIT_SHA to the commit that was
  // pushed, so sha256 of that value is the build's identity: a deploy-time
  // check that derives the same hash from the pushed commit proves the alias
  // serves that commit. The hash is a fingerprint, not a secret.
  env: {
    SITE_BUILD_HASH: process.env.VERCEL_GIT_COMMIT_SHA
      ? createHash("sha256").update(process.env.VERCEL_GIT_COMMIT_SHA).digest("hex").slice(0, 16)
      : "local",
  },
  // mermaid-isomorphic must stay a real Node require: bundling it breaks
  // `path.resolve` ({} shim) during page-data collection.
  serverExternalPackages: ["mermaid-isomorphic", "rehype-mermaid"],
  async redirects() {
    // Feature guides and AI search surface guides now live on Paid Media Decoded,
    // built from the same public datasets (see Rajeev-SG/paid-media-decoded,
    // src/lib/intel.ts). The interactive explorer and the observation plane stay here.
    // Only the 20 published surfaces redirect; unpublished ones keep their pages.
    const pmd = "https://paidmediadecoded.com"
    return [
      { source: "/solutions/capability-explorer/guides/ga.:feature", destination: `${pmd}/features/google-ads-:feature/`, permanent: true },
      { source: "/solutions/capability-explorer/guides/meta.:feature", destination: `${pmd}/features/meta-:feature/`, permanent: true },
      { source: "/solutions/capability-explorer/guides/pin.:feature", destination: `${pmd}/features/pinterest-:feature/`, permanent: true },
      { source: "/solutions/capability-explorer/guides/tt.:feature", destination: `${pmd}/features/tiktok-:feature/`, permanent: true },
      ...['amazon-rufus', 'baidu-ai-search', 'bing-copilot-search', 'brave-answer-with-ai', 'brave-leo', 'chatgpt', 'claude', 'deepseek-chat', 'doubao', 'google-ai-search', 'google-gemini', 'grok', 'kimi', 'meta-ai', 'microsoft-copilot', 'naver-ai', 'perplexity', 'qwen-consumer', 'tencent-yuanbao', 'yandex-ai-search'].map(slug => ({ source: `/solutions/ai-discovery/surfaces/${slug}`, destination: `${pmd}/ai-search/${slug}/`, permanent: true })),
    ]
  },
  async rewrites() {
    // The AI discovery observation plane is its own deployment (repo:
    // Rajeev-SG/ai-discovery-intelligence, web/ root, built with
    // BASE_PATH=/solutions/ai-discovery). Proxied here so the product lives on
    // the main domain while the two codebases deploy independently. Override
    // the target with AI_DISCOVERY_ORIGIN for local development.
    const aiDiscoveryOrigin =
      process.env.AI_DISCOVERY_ORIGIN ??
      "https://ai-discovery-observation-plane-rajeevgills-projects.vercel.app"

    // Paid Media Decoded origin; override with DECODED_ORIGIN for local development.
    const decodedOrigin = process.env.DECODED_ORIGIN ?? "https://paid-media-decoded.vercel.app"

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
        // Paid Media Decoded is a static Astro site deployed as its own Vercel
        // project (repo: paid-media-decoded, built with PMD_BASE=/solutions/decoded
        // so every asset and link carries this prefix). The prefix is stripped on
        // the way to the origin, which serves flat clean-URL pages.
        { source: "/solutions/decoded", destination: `${decodedOrigin}/` },
        { source: "/solutions/decoded/:path*", destination: `${decodedOrigin}/:path*` },
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
