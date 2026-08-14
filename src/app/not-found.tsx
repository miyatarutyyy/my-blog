import Link from "next/link";

import { SkkTyping } from "@/src/components/SkkTyping";

import styles from "./not-found.module.css";

const statusCodeTypingPlan = [
  {
    mode: "literal",
    input: "404",
  },
] as const;

const messageTypingPlan = [
  {
    mode: "literal",
    input: "NOT FOUND",
  },
] as const;

const homeLinkTypingPlan = [
  {
    mode: "literal",
    input: "[ HOME",
  },
  {
    input: "he",
    reading: "へ",
    output: "へ",
    convert: false,
  },
  {
    input: "modo",
    reading: "もど",
    output: "戻",
    convert: true,
    candidates: ["戻"],
  },
  {
    input: "ru",
    reading: "る",
    output: "る",
    convert: false,
  },
  {
    mode: "literal",
    input: " ]",
  },
] as const;

export default function NotFound() {
  return (
    <main className={styles.main} aria-label="Page not found">
      <h1 className={styles.statusCode}>
        <SkkTyping label="404" plan={statusCodeTypingPlan} />
      </h1>
      <span className={styles.divider} aria-hidden="true" />
      <p className={styles.message}>
        <SkkTyping label="NOT FOUND" plan={messageTypingPlan} />
      </p>
      <Link className={styles.homeLink} href="/">
        <SkkTyping label="[ HOMEへ戻る ]" plan={homeLinkTypingPlan} />
      </Link>
    </main>
  );
}
