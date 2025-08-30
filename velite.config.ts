import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePreMermaid from '@/lib/rehype-pre-mermaid'
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
      rehypePreMermaid,
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
