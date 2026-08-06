import Link from 'next/link'

import { getPosts } from '@/lib/posts'

export default async function BlogIndexPage() {
  const posts = await getPosts()

  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => {
          return (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
              {post.date ? (
                <time dateTime={post.date}>{post.date}</time>
              ) : null}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
