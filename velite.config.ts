import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import { defineCollection, defineConfig, s } from 'velite'

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.md',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('post'),
      date: s.isodate(),
      description: s.string().max(500).optional(),
      draft: s.boolean().default(false),
      tags: s.array(s.string()).default([]),
      excerpt: s.excerpt(),
      content: s.markdown()
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
          transformers: [transformerCopyButton()],
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
