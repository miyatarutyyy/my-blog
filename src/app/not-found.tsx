import { NotFoundAnimation } from "./NotFoundAnimation";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.main} aria-label="Page not found">
      <div className={styles.content}>
        <NotFoundAnimation />
      </div>
    </main>
  );
}
