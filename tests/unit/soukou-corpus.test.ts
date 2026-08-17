import { describe, expect, test } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectSoukouCorpus,
  collectSoukouCorpusFromTsx,
} from "@/scripts/soukou-corpus/collector.mjs";

describe("SoukouMincho corpus collector", () => {
  test("collects text from data-font soukou JSX", () => {
    const result = collectSoukouCorpusFromTsx(
      `
      export function Example() {
        return <h1 data-font="soukou">名称未定</h1>;
      }
      `
    );

    expect(result.texts).toContain("名称未定");
  });

  test("ignores unmarked JSX text", () => {
    const result = collectSoukouCorpusFromTsx(
      `
      export function Example() {
        return <h1>名称未定</h1>;
      }
      `
    );

    expect(result.texts).toEqual([]);
  });

  test("collects SkkTyping label and plan strings in a marked subtree", () => {
    const result = collectSoukouCorpusFromTsx(
      `
      const titleTypingPlan = [
        {
          input: "meisyou",
          reading: "めいしょう",
          output: "名称",
          convert: true,
          candidates: ["名称"],
        },
      ] as const;

      export function Example() {
        return (
          <h1 data-font="soukou">
            <SkkTyping label="名称" plan={titleTypingPlan} />
          </h1>
        );
      }
      `
    );

    expect(result.texts).toEqual([
      "名称",
      "meisyou",
      "めいしょう",
      "名称",
      "名称",
      "▽▼",
    ]);
  });

  test("fails on dynamic text in a marked subtree", () => {
    expect(() =>
      collectSoukouCorpusFromTsx(
        `
        export function Example({ title }: { title: string }) {
          return <h1 data-font="soukou">{title}</h1>;
        }
        `,
        { filePath: "example.tsx" }
      )
    ).toThrow('Cannot collect dynamic text for data-font="soukou"');
  });

  test("appends corpus fragments", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "soukou-corpus-"));
    const appDirectory = path.join(projectRoot, "src/app");
    const fontsDirectory = path.join(projectRoot, "src/app/fonts");

    await mkdir(fontsDirectory, { recursive: true });
    await writeFile(
      path.join(appDirectory, "page.tsx"),
      `
      export function Example() {
        return <h1 data-font="soukou">名称未定</h1>;
      }
      `
    );
    await writeFile(
      path.join(fontsDirectory, "loading.soukou-corpus.txt"),
      ["# loading sample", "永"].join("\n")
    );

    const result = await collectSoukouCorpus({ projectRoot });

    expect(result.corpus).toContain("名称未定");
    expect(result.corpus).toContain("永");
  });
});
