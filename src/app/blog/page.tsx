import Link from "next/link";

import { getPosts } from "@/lib/posts";

import styles from "./page.module.css";

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Blog</h1>
      {posts.length === 0 ? (
        <p className={styles.empty}>記事がありません。</p>
      ) : (
        <ul className={styles.postList}>
          {posts.map((post) => {
            return (
              <li className={styles.postItem} key={post.slug}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                {post.date ? (
                  <time className={styles.postDate} dateTime={post.date}>
                    {post.date}
                  </time>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
