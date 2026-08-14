"use client";

import Link from "next/link";

import { SkkTyping } from "@/src/components/SkkTyping";
import { useLoadingReady } from "@/src/components/Loading/loading-ready";

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
    input: "[ HOME ",
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

export function NotFoundAnimation() {
  const loadingReady = useLoadingReady();
  const notFoundMarkClassName = loadingReady
    ? `${styles.notFoundMark} ${styles.notFoundMarkReady}`
    : styles.notFoundMark;

  return (
    <div className={notFoundMarkClassName}>
      <span
        className={`${styles.sideGlyph} ${styles.leftGlyph}`}
        aria-hidden="true"
      >
        不
      </span>
      <div className={styles.centerBlock}>
        <h1 className={styles.statusCode}>
          <SkkTyping label="404" plan={statusCodeTypingPlan} />
        </h1>
        <span className={styles.divider} aria-hidden="true" />
        <p className={styles.message}>
          <SkkTyping label="NOT FOUND" plan={messageTypingPlan} />
        </p>
      </div>
      <span
        className={`${styles.sideGlyph} ${styles.rightGlyph}`}
        aria-hidden="true"
      >
        在
      </span>
      <Link className={styles.homeLink} href="/">
        <SkkTyping label="[ HOME へ戻る ]" plan={homeLinkTypingPlan} />
      </Link>
    </div>
  );
}
