import "server-only"

import { compile } from "@mdx-js/mdx"

import { sharedMdxRehypePlugins, sharedMdxRemarkPlugins } from "@/lib/mdx-pipeline"

export async function compilePreviewMdx(markdown: string) {
  const compiled = await compile(markdown, {
    outputFormat: "function-body",
    development: false,
    remarkPlugins: sharedMdxRemarkPlugins as never[],
    rehypePlugins: sharedMdxRehypePlugins as never[],
  })

  return String(compiled)
}
