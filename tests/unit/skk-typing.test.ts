import { describe, expect, test } from "vitest";

import {
  compileSkkFrames,
  compileSkkFramesSafely,
  expandRomajiKeystrokes,
  normalizeCandidates,
  SkkPlanError,
  type RomajiSegment,
} from "@/lib/skk-typing";

function frameTexts(frames: ReturnType<typeof compileSkkFrames>) {
  return frames.map((frame) => {
    return `${frame.committed}${frame.marker ?? ""}${frame.composing}`;
  });
}

describe("expandRomajiKeystrokes", () => {
  test("expands basic romaji after each key press", () => {
    expect(
      expandRomajiKeystrokes("he", "へ").map((state) => state.text)
    ).toEqual(["h", "へ"]);
  });

  test("keeps n pending until the following key proves it is 撥音", () => {
    expect(
      expandRomajiKeystrokes("henkan", "へんかん").map((state) => state.text)
    ).toEqual(["h", "へ", "へn", "へんk", "へんか", "へんかn", "へんかん"]);
  });

  test("flushes word-final n as 撥音", () => {
    expect(
      expandRomajiKeystrokes("hon", "ほん").map((state) => state.text)
    ).toEqual(["h", "ほ", "ほn", "ほん"]);
  });

  test("expands thi as ティ-style small vowel input", () => {
    expect(
      expandRomajiKeystrokes("taruthi", "たるてぃ").map(
        (state) => state.text
      )
    ).toEqual(["t", "た", "たr", "たる", "たるt", "たるth", "たるてぃ"]);
  });

  test("expands home page link label words with repository romaji rules", () => {
    expect(expandRomajiKeystrokes("kizi", "きじ").at(-1)?.text).toBe("きじ");
    expect(expandRomajiKeystrokes("itiran", "いちらん").at(-1)?.text).toBe(
      "いちらん"
    );
    expect(expandRomajiKeystrokes("gaibu", "がいぶ").at(-1)?.text).toBe(
      "がいぶ"
    );
    expect(expandRomajiKeystrokes("setuzoku", "せつぞく").at(-1)?.text).toBe(
      "せつぞく"
    );
  });

  test("expands doubled consonants as 促音", () => {
    expect(
      expandRomajiKeystrokes("gakkou", "がっこう").map((state) => state.text)
    ).toEqual(["g", "が", "がk", "がっk", "がっこ", "がっこう"]);
  });

  test("rejects unsupported romanization", () => {
    expect(() => expandRomajiKeystrokes("shi", "し")).toThrow(SkkPlanError);
  });
});

describe("compileSkkFrames", () => {
  test("generates preedit, candidate, and commit frames for conversion", () => {
    const frames = compileSkkFrames([
      {
        input: "henkan",
        reading: "へんかん",
        output: "変換",
        convert: true,
      },
    ]);

    expect(frameTexts(frames)).toEqual([
      "▽h",
      "▽へ",
      "▽へn",
      "▽へんk",
      "▽へんか",
      "▽へんかn",
      "▽へんかん",
      "▼変換",
      "変換",
    ]);
  });

  test("generates direct frames for non-converting romaji", () => {
    const frames = compileSkkFrames([
      {
        input: "suru",
        reading: "する",
        output: "する",
        convert: false,
      },
    ]);

    expect(frameTexts(frames)).toEqual(["s", "す", "すr", "する"]);
    expect(frames[1]).toEqual({
      committed: "す",
      composing: "",
      marker: null,
      phase: "direct",
    });
  });

  test("uses output as the effective candidate when candidates are omitted", () => {
    const segment = {
      input: "henkan",
      reading: "へんかん",
      output: "変換",
      convert: true,
    } satisfies RomajiSegment;

    expect(normalizeCandidates(segment)).toEqual(["変換"]);
  });

  test("preserves explicit candidate order", () => {
    const frames = compileSkkFrames([
      {
        input: "kikai",
        reading: "きかい",
        output: "機械",
        convert: true,
        candidates: ["機会", "機械"],
      },
    ]);

    expect(frameTexts(frames)).toContain("▼機会");
    expect(frameTexts(frames)).toContain("▼機械");
  });

  test("rejects invalid candidates", () => {
    expect(() =>
      compileSkkFrames([
        {
          input: "kikai",
          reading: "きかい",
          output: "機械",
          convert: true,
          candidates: [],
        },
      ])
    ).toThrow(SkkPlanError);

    expect(() =>
      compileSkkFrames([
        {
          input: "kikai",
          reading: "きかい",
          output: "機械",
          convert: true,
          candidates: ["機会"],
        },
      ])
    ).toThrow(SkkPlanError);
  });

  test("rejects direct romaji when reading and output differ", () => {
    expect(() =>
      compileSkkFrames([
        {
          input: "henkan",
          reading: "へんかん",
          output: "変換",
          convert: false,
        },
      ])
    ).toThrow(SkkPlanError);
  });

  test("generates literal frames without romaji conversion", () => {
    const frames = compileSkkFrames([{ mode: "literal", input: "OpenAI" }]);

    expect(frameTexts(frames)).toEqual([
      "O",
      "Op",
      "Ope",
      "Open",
      "OpenA",
      "OpenAI",
    ]);
  });

  test("returns a safe fallback result when runtime compile fails", () => {
    const result = compileSkkFramesSafely([
      {
        input: "shi",
        reading: "し",
        output: "し",
        convert: false,
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.frames).toEqual([]);
    expect(result.label).toBe("し");
  });
});
