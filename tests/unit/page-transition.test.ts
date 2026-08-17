import { describe, expect, test } from "vitest";

import {
  shouldHandlePageTransition,
  type PageTransitionClick,
} from "@/src/components/PageTransition/page-transition";

const normalClick: PageTransitionClick = {
  button: 0,
  defaultPrevented: false,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

describe("shouldHandlePageTransition", () => {
  const currentUrl = "https://example.com/blog";

  test("handles normal same-origin navigation to another path", () => {
    expect(
      shouldHandlePageTransition({
        click: normalClick,
        href: "/blog/test-article",
        currentUrl,
      })
    ).toBe(true);
  });

  test("does not handle modified clicks", () => {
    expect(
      shouldHandlePageTransition({
        click: { ...normalClick, metaKey: true },
        href: "/blog/test-article",
        currentUrl,
      })
    ).toBe(false);
  });

  test("does not handle links that open a new tab", () => {
    expect(
      shouldHandlePageTransition({
        click: normalClick,
        href: "/blog/test-article",
        target: "_blank",
        currentUrl,
      })
    ).toBe(false);
  });

  test("does not handle external links", () => {
    expect(
      shouldHandlePageTransition({
        click: normalClick,
        href: "https://other.example.com/blog",
        currentUrl,
      })
    ).toBe(false);
  });

  test("does not handle same-page hash changes", () => {
    expect(
      shouldHandlePageTransition({
        click: normalClick,
        href: "/blog#article-list",
        currentUrl,
      })
    ).toBe(false);
  });

  test("does not handle same-page search parameter changes", () => {
    expect(
      shouldHandlePageTransition({
        click: normalClick,
        href: "/blog?page=2",
        currentUrl,
      })
    ).toBe(false);
  });
});
