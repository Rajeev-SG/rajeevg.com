import { posts, type Post } from "#velite"

const includeDrafts = process.env.NODE_ENV !== "production"

export function getPostEffectiveDate(post: Pick<Post, "date" | "updated">) {
  return post.updated ?? post.date
}

export function getVisiblePosts() {
  return posts.filter((post: Post) => includeDrafts || !post.draft)
}

export function getSortedVisiblePosts() {
  return [...getVisiblePosts()].sort(
    (a: Post, b: Post) =>
      new Date(getPostEffectiveDate(b)).getTime() - new Date(getPostEffectiveDate(a)).getTime()
  )
}

export function getVisiblePostBySlug(slug: string) {
  return getVisiblePosts().find((post: Post) => post.slug === slug)
}
