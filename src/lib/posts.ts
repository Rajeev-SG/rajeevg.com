import { posts, type Post } from "#velite"

const includeDrafts = process.env.NODE_ENV !== "production"

export function getVisiblePosts() {
  return posts.filter((post: Post) => includeDrafts || !post.draft)
}

export function getSortedVisiblePosts() {
  return [...getVisiblePosts()].sort(
    (a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getVisiblePostBySlug(slug: string) {
  return getVisiblePosts().find((post: Post) => post.slug === slug)
}
