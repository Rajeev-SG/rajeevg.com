import { defineCollection, defineConfig, s } from 'velite'
import {
  sharedMarkdownRehypePlugins,
  sharedMdxRehypePlugins,
  sharedMdxRemarkPlugins,
} from './src/lib/mdx-pipeline'

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.{md,mdx}',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('post'),
      date: s.isodate(),
      updated: s.isodate().optional(),
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
    rehypePlugins: sharedMarkdownRehypePlugins as any,
  },
  mdx: {
    remarkPlugins: sharedMdxRemarkPlugins as any,
    rehypePlugins: sharedMdxRehypePlugins as any,
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
