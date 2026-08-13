import Link from "next/link";

import { SkkTyping } from "@/src/components/SkkTyping";

import styles from "./page.module.css";

const titleTypingPlan = [
  {
    mode: "literal",
    input: "ARCHIVYYY",
  },
] as const;

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>
            <SkkTyping label="ARCHIVYYY" plan={titleTypingPlan} />
          </h1>
          <span className={styles.divider} aria-hidden="true" />
          <p>たるてぃのブログサイト</p>
          <div className={styles.links}>
            <Link href="/blog">[ 記事一覧 ]</Link>
            <Link href="/socials">[ 外部接続 ]</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
