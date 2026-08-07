import { expect, test } from "@playwright/test";

test.describe("public routing", () => {
  test("renders the home page", async ({ request }) => {
    const response = await request.get("/");

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("ARCHIVYYY");
  });

  test("renders the blog index", async ({ request }) => {
    const response = await request.get("/blog");

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Blog");
    expect(await response.text()).toContain("テスト記事");
  });

  test("renders an existing article detail page", async ({ request }) => {
    const response = await request.get("/blog/test-article");

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("テスト記事");
    expect(await response.text()).toContain(
      "これは、Next.jsとuniorgで表示する最初の記事です。"
    );
  });

  test("uses the article title as the article detail metadata title", async ({
    request,
  }) => {
    const response = await request.get("/blog/test-article");

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("<title>テスト記事</title>");
  });

  test("returns 404 for a slug that was not statically generated", async ({
    request,
  }) => {
    const response = await request.get("/blog/missing");

    expect(response.status()).toBe(404);
    expect(await response.text()).toContain("Page not found");
  });

  test("returns site-level 404 for an unknown route", async ({ request }) => {
    const response = await request.get("/unknown-route");

    expect(response.status()).toBe(404);
    expect(await response.text()).toContain("Page not found");
  });
});
