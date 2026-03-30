import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeMermaid from "rehype-mermaid"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

export const sharedMarkdownRehypePlugins = [
  [
    rehypeMermaid as never,
    {
      strategy: "pre-mermaid",
    },
  ],
  [
    rehypePrettyCode,
    {
      theme: { light: "github-light", dark: "github-dark" },
    },
  ],
]

export const sharedMdxRemarkPlugins = [remarkGfm]

export const sharedMdxRehypePlugins = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings as never,
    { behavior: "wrap", properties: { className: ["heading-anchor"] } },
  ],
  [
    rehypeMermaid as never,
    {
      strategy: "pre-mermaid",
    },
  ],
  [
    rehypePrettyCode,
    {
      theme: { light: "github-light", dark: "github-dark" },
    },
  ],
]
