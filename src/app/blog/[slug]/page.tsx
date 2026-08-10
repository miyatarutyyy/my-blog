import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { orgToHtml } from "@/lib/org";
import { getPost, getPostSlugs } from "@/lib/posts";

import styles from "./page.module.css";

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
 * generateStaticParams() が返さなかった slug も page まで到達させる。
 * 記事の有無は getPost() の結果で判定し、存在しなければ記事用 404 を表示する。
 */
export const dynamicParams = true;

const getCachedPost = cache(async (slug: string) => {
  return getPost(slug);
});

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPost(slug);

  if (post == null) {
    notFound();
  }

  return {
    title: post.title ?? slug,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await getCachedPost(slug);

  if (post == null) {
    notFound();
  }

  const html = await orgToHtml(post.source);

  return (
    <main className={styles.main}>
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>{post.title}</h1>
          {post.date ? (
            <time className={styles.date} dateTime={post.date}>
              {post.date}
            </time>
          ) : null}
        </header>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </article>
    </main>
  );
}
