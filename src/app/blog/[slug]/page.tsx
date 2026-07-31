import { notFound } from 'next/navigation'

import { orgToHtml } from '@/lib/org'
import { getPostSlugs, getPostSource, } from '@/lib/posts'

type BlogPostPageProps = {
  params: Promise<{
    slug: string
  }>
}

/*
 * slug の一覧を返却
 */
export async function generateStaticParams() {
  const slugs = await getPostSlugs()

  return slugs.map((slug) => ({
    slug,
  }))
}

/*
 * generateStaticParams() が返さなかった slug へのアクセス
 * これを 404 として処理
 */
export const dynamicParams = false

export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } = await params

  const source = await getPostSource(slug)

  if (source == null) {
    notFound()
  }


  const html = await orgToHtml(source)

  return (
    <main>
      <article
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </main>
  )
}
