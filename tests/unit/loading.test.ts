import { describe, expect, test } from "vitest";

import { getPrimaryFontFamily } from "@/src/components/Loading/font-family";
import {
  createInitialFontStates,
  getFontStatusLabel,
  getNextLoadingFrame,
  getWebFonts,
  isFontLoadSettled,
  type LoadingFontDefinition,
} from "@/src/components/Loading/loading-state";

describe("getPrimaryFontFamily", () => {
  test("returns a single font family unchanged", () => {
    expect(getPrimaryFontFamily('"__SoukouMincho_abc123"')).toBe(
      '"__SoukouMincho_abc123"'
    );
  });

  test("returns the first family from a fallback list", () => {
    expect(
      getPrimaryFontFamily(
        '"__SoukouMincho_abc123", "__SoukouMincho_Fallback_abc123"'
      )
    ).toBe('"__SoukouMincho_abc123"');
  });
});

describe("Loading font states", () => {
  const fonts = [
    {
      id: "system",
      kind: "system",
      label: "System fallback",
      fontFamily: "system-ui, sans-serif",
      sampleText: "A",
    },
    {
      id: "soukou-mincho",
      kind: "web",
      label: "SoukouMincho",
      fontFamily: '"__SoukouMincho_abc123"',
      sampleText: "永",
    },
  ] satisfies LoadingFontDefinition[];

  test("marks system fonts as ready and web fonts as idle initially", () => {
    expect(createInitialFontStates(fonts).map((font) => font.status)).toEqual([
      "ready",
      "idle",
    ]);
  });

  test("uses web fonts as the animated loading sequence targets", () => {
    expect(getWebFonts(fonts).map((font) => font.id)).toEqual([
      "soukou-mincho",
    ]);
  });

  test("formats font status labels for the loading list", () => {
    expect(getFontStatusLabel("ready", 0)).toBe("[ READY ]");
    expect(getFontStatusLabel("idle", 0)).toBe("[ ----- ]");
    expect(getFontStatusLabel("loading", 0)).toBe("[ #.... ]");
    expect(getFontStatusLabel("loading", 1)).toBe("[ .#... ]");
    expect(getFontStatusLabel("loading", 2)).toBe("[ ..#.. ]");
    expect(getFontStatusLabel("loading", 3)).toBe("[ ...#. ]");
    expect(getFontStatusLabel("loading", 4)).toBe("[ ....# ]");
    expect(getFontStatusLabel("timeout", 0)).toBe("[TIMEOUT]");
    expect(getFontStatusLabel("failed", 0)).toBe("[ ERROR ]");
  });

  test("cycles the indeterminate loading frame", () => {
    expect(getNextLoadingFrame(0)).toBe(1);
    expect(getNextLoadingFrame(4)).toBe(0);
  });

  test("treats ready, timeout, and failed states as settled", () => {
    const [systemFont, webFont] = createInitialFontStates(fonts);

    expect(isFontLoadSettled(systemFont)).toBe(true);
    expect(isFontLoadSettled(webFont)).toBe(false);
    expect(isFontLoadSettled({ ...webFont, status: "timeout" })).toBe(true);
    expect(isFontLoadSettled({ ...webFont, status: "failed" })).toBe(true);
  });
});
