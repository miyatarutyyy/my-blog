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

const openBracketTypingPlan = [
	{
		mode: "literal",
		input: "[",
	},
] as const;

const closeBracketTypingPlan = [
	{
		mode: "literal",
		input: "]",
	},
] as const;

const linkTypingDelays = {
	openBracket: 400,
	label: 520,
	closeBracket: 2225,
} as const;

const blogLinkTypingPlan = [
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
] as const;

const socialsLinkTypingPlan = [
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
] as const;

export default function Home() {
	return (
		<div className={styles.hero}>
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
					<div className={styles.links} data-font="soukou">
						<TransitionLink className={styles.linkItem} href="/blog">
							<span className={styles.linkBracket} aria-hidden="true">
								<SkkTyping
									label="["
									plan={openBracketTypingPlan}
									startDelayMs={linkTypingDelays.openBracket}
								/>
							</span>
							<span className={styles.linkLabel}>
								<SkkTyping
									label="記事一覧"
									plan={blogLinkTypingPlan}
									startDelayMs={linkTypingDelays.label}
								/>
							</span>
							<span className={styles.linkBracket} aria-hidden="true">
								<SkkTyping
									label="]"
									plan={closeBracketTypingPlan}
									startDelayMs={linkTypingDelays.closeBracket}
								/>
							</span>
						</TransitionLink>
						<TransitionLink className={styles.linkItem} href="/socials">
							<span className={styles.linkBracket} aria-hidden="true">
								<SkkTyping
									label="["
									plan={openBracketTypingPlan}
									startDelayMs={linkTypingDelays.openBracket}
								/>
							</span>
							<span className={styles.linkLabel}>
								<SkkTyping
									label="外部接続"
									plan={socialsLinkTypingPlan}
									startDelayMs={linkTypingDelays.label}
								/>
							</span>
							<span className={styles.linkBracket} aria-hidden="true">
								<SkkTyping
									label="]"
									plan={closeBracketTypingPlan}
									startDelayMs={linkTypingDelays.closeBracket}
								/>
							</span>
						</TransitionLink>
					</div>
				</HomeIntro>
			</main>
		</div>
	);
}
