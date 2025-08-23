import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeMermaid from 'rehype-mermaid'
import { defineCollection, defineConfig, s } from 'velite'

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.{md,mdx}',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('post'),
      date: s.isodate(),
      description: s.string().max(500).optional(),
      draft: s.boolean().default(false),
      tags: s.array(s.string()).default([]),
      excerpt: s.excerpt(),
      image: s.string().optional(),
      code: s.mdx(),
    })
    .transform((data) => ({
      ...data,
      permalink: `/blog/${data.slug}`
    })),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { posts },
  markdown: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
        },
      ],
    ],
  },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings as any,
        { behavior: 'wrap', properties: { className: ['heading-anchor'] } },
      ] as any,
      [
        rehypeMermaid as any,
        {
          strategy: 'inline-svg',
          mermaidConfig: {
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'base',
            themeVariables: {
              /* Use concrete colors that render well in both themes */
              primaryColor: '#ffffff',
              primaryTextColor: '#111111',
              primaryBorderColor: '#e5e7eb',
              lineColor: '#9ca3af',
              tertiaryColor: '#f7f7f7',
              background: 'transparent'
            }
          }
        }
      ] as any,
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
        },
      ],
    ],
  },
  prepare: ({ posts }) => {
    // Filter out drafts in production
    if (process.env.NODE_ENV === 'production') {
      const published = posts.filter((p) => !p.draft)
      posts.length = 0
      posts.push(...published)
    }
  },
})
