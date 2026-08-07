import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { orgToHtml } from "@/lib/org";
import { getPost, getPostSlugs } from "@/lib/posts";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/*
 * slug の一覧を返却
 */
export async function generateStaticParams() {
  const slugs = await getPostSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

/*
 * generateStaticParams() が返さなかった slug へのアクセス
 * これを 404 として処理
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (post == null) {
    notFound();
  }

  return {
    title: post.title ?? slug,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await getPost(slug);

  if (post == null) {
    notFound();
  }

  const html = await orgToHtml(post.source);

  return (
    <main>
      <article>
        <header>
          <h1>{post.title}</h1>
          {post.date ? <time dateTime={post.date}>{post.date}</time> : null}
        </header>
        <div
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </article>
    </main>
  );
}
