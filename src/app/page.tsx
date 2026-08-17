import { TransitionLink } from "@/src/components/PageTransition";
import { SkkTyping } from "@/src/components/SkkTyping";

import { HomeIntro } from "./HomeIntro";
import styles from "./page.module.css";

const titleTypingPlan = [
  {
    input: "meisyou",
    reading: "めいしょう",
    output: "名称",
    convert: true,
    candidates: ["名称"],
  },
  {
    input: "mitei",
    reading: "みてい",
    output: "未定",
    convert: true,
    candidates: ["未定"],
  },
] as const;

const subtitleTypingPlan = [
  {
    input: "taruthino",
    reading: "たるてぃの",
    output: "たるてぃの",
    convert: false,
  },
  {
    input: "burogusaito",
    reading: "ぶろぐさいと",
    output: "ブログサイト",
    convert: true,
    candidates: ["ブログサイト"],
  },
] as const;

const blogLinkTypingPlan = [
  {
    mode: "literal",
    input: "[ ",
  },
  {
    input: "kizi",
    reading: "きじ",
    output: "記事",
    convert: true,
    candidates: ["生地", "記事"],
  },
  {
    input: "itiran",
    reading: "いちらん",
    output: "一覧",
    convert: true,
    candidates: ["一覧"],
  },
  {
    mode: "literal",
    input: " ]",
  },
] as const;

const socialsLinkTypingPlan = [
  {
    mode: "literal",
    input: "[ ",
  },
  {
    input: "gaibu",
    reading: "がいぶ",
    output: "外部",
    convert: true,
    candidates: ["外部"],
  },
  {
    input: "setuzoku",
    reading: "せつぞく",
    output: "接続",
    convert: true,
    candidates: ["接続"],
  },
  {
    mode: "literal",
    input: " ]",
  },
] as const;

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HomeIntro>
          <h1 data-font="soukou">
            <SkkTyping label="名称未定" plan={titleTypingPlan} />
          </h1>
          <span className={styles.divider} aria-hidden="true" />
          <p data-font="soukou">
            <SkkTyping
              label="たるてぃのブログサイト"
              plan={subtitleTypingPlan}
            />
          </p>
          <div className={styles.links}>
            <TransitionLink href="/blog">
              <SkkTyping label="[ 記事一覧 ]" plan={blogLinkTypingPlan} />
            </TransitionLink>
            <TransitionLink href="/socials">
              <SkkTyping label="[ 外部接続 ]" plan={socialsLinkTypingPlan} />
            </TransitionLink>
          </div>
        </HomeIntro>
      </main>
    </div>
  );
}
