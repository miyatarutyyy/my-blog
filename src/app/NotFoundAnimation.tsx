"use client";

import { useState } from "react";
import Link from "next/link";

import { SkkTyping } from "@/src/components/SkkTyping";

import styles from "./not-found.module.css";

type TypingCompletion = {
  statusCode: boolean;
  message: boolean;
  homeLink: boolean;
};

type TypingTarget = keyof TypingCompletion;

const initialTypingCompletion: TypingCompletion = {
  statusCode: false,
  message: false,
  homeLink: false,
};

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
    okuriKey: "r",
    output: "戻る",
    convert: true,
    candidates: ["戻る"],
  },
  {
    mode: "literal",
    input: " ]",
  },
] as const;

export function NotFoundAnimation() {
  const [typingCompletion, setTypingCompletion] = useState(
    initialTypingCompletion
  );

  const allTypingCompleted =
    typingCompletion.statusCode &&
    typingCompletion.message &&
    typingCompletion.homeLink;

  const notFoundMarkClassName = allTypingCompleted
    ? `${styles.notFoundMark} ${styles.notFoundMarkReveal}`
    : styles.notFoundMark;

  const markTypingComplete = (target: TypingTarget) => {
    setTypingCompletion((current) => {
      if (current[target]) {
        return current;
      }

      return {
        ...current,
        [target]: true,
      };
    });
  };

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
          <SkkTyping
            label="404"
            plan={statusCodeTypingPlan}
            onComplete={() => markTypingComplete("statusCode")}
          />
        </h1>
        <span className={styles.divider} aria-hidden="true" />
        <p className={styles.message}>
          <SkkTyping
            label="NOT FOUND"
            plan={messageTypingPlan}
            onComplete={() => markTypingComplete("message")}
          />
        </p>
      </div>
      <span
        className={`${styles.sideGlyph} ${styles.rightGlyph}`}
        aria-hidden="true"
      >
        在
      </span>
      <Link className={styles.homeLink} href="/">
        <SkkTyping
          label="[ HOME へ戻る ]"
          plan={homeLinkTypingPlan}
          onComplete={() => markTypingComplete("homeLink")}
        />
      </Link>
    </div>
  );
}
