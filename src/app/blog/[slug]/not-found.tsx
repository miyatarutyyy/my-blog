import Link from 'next/link'

export default function BlogPostNotFound() {
  return (
    <main>
      <h1>Article not found</h1>
      <p>The requested article does not exist.</p>
      <p>
        <Link href="/blog">Back to blog index</Link>
      </p>
    </main>
  )
}
