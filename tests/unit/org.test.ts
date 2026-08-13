import { describe, expect, test } from "vitest";

import { orgToHtml } from "@/lib/org";

/*
 * uniorg は外部ライブラリであり、
 * どこで throw するのか分からないため正常系でテスト
 */
describe("orgToHtml", () => {
  test("converts Org headings, paragraphs, and lists to HTML", async () => {
    const html = await orgToHtml(`* Heading

Paragraph text.

- First item
- Second item
`);

    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<p>Paragraph text.");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>First item");
    expect(html).toContain("<li>Second item");
  });
});
