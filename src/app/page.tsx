import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>ARCHIVYYY</h1>
        <Link href="/blog">Blog</Link>
      </main>
    </div>
  );
}
