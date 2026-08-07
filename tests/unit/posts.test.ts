import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { createPostsRepository } from "@/lib/posts";

const tempContentDirectories: string[] = [];

async function createTempContentDirectory() {
  const contentDirectory = await mkdtemp(
    path.join(tmpdir(), "archivyyy-posts-")
  );
  tempContentDirectories.push(contentDirectory);

  return contentDirectory;
}

async function writePost(
  contentDirectory: string,
  slug: string,
  source: string
) {
  await writeFile(path.join(contentDirectory, `${slug}.org`), source, "utf8");
}

describe("createPostsRepository", () => {
  afterEach(async () => {
    await Promise.all(
      tempContentDirectories.splice(0).map((contentDirectory) => {
        return rm(contentDirectory, {
          recursive: true,
          force: true,
        });
      })
    );
  });

  test("getPostSlugs returns slugs from Org files only", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(contentDirectory, "first-post", "#+TITLE: First\n");
    await writePost(contentDirectory, "second_post", "#+TITLE: Second\n");
    await writeFile(
      path.join(contentDirectory, "draft.txt"),
      "ignored",
      "utf8"
    );
    await mkdir(path.join(contentDirectory, "nested.org"));

    const posts = createPostsRepository(contentDirectory);

    const slugs = await posts.getPostSlugs();

    expect(slugs).toHaveLength(2);
    expect(slugs).toEqual(
      expect.arrayContaining(["first-post", "second_post"])
    );
  });

  test("getPostSource returns source for an existing slug", async () => {
    const contentDirectory = await createTempContentDirectory();
    const source = "#+TITLE: Test\n\n* Body\n";
    await writePost(contentDirectory, "test-article", source);

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPostSource("test-article")).resolves.toBe(source);
  });

  test("getPostSource returns null for a missing slug", async () => {
    const contentDirectory = await createTempContentDirectory();
    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPostSource("missing")).resolves.toBeNull();
  });

  test.each(["../secret", "nested/secret", "..%2Fsecret", "secret.org", ""])(
    "getPostSource rejects invalid slug %j",
    async (slug) => {
      const contentDirectory = await createTempContentDirectory();
      const posts = createPostsRepository(contentDirectory);

      await expect(posts.getPostSource(slug)).resolves.toBeNull();
    }
  );

  test("getPost returns article metadata and source", async () => {
    const contentDirectory = await createTempContentDirectory();
    const source = "#+TITLE: Test Article\n#+DATE: 2026-07-31\n\n* Body\n";
    await writePost(contentDirectory, "test-article", source);

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("test-article")).resolves.toEqual({
      slug: "test-article",
      title: "Test Article",
      date: "2026-07-31",
      source,
    });
  });

  test("getPost uses the slug and empty date when Org keywords are missing", async () => {
    const contentDirectory = await createTempContentDirectory();
    const source = "* Body\n";
    await writePost(contentDirectory, "untitled", source);

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("untitled")).resolves.toEqual({
      slug: "untitled",
      title: "untitled",
      date: "",
      source,
    });
  });

  test("getPost returns null for missing and invalid slugs", async () => {
    const contentDirectory = await createTempContentDirectory();
    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("missing")).resolves.toBeNull();
    await expect(posts.getPost("../secret")).resolves.toBeNull();
  });

  test("getPosts returns list items sorted by date descending", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(
      contentDirectory,
      "older",
      "#+TITLE: Older\n#+DATE: 2026-01-01\n\n* Body\n"
    );
    await writePost(
      contentDirectory,
      "newer",
      "#+TITLE: Newer\n#+DATE: 2026-02-01\n\n* Body\n"
    );

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPosts()).resolves.toEqual([
      {
        slug: "newer",
        title: "Newer",
        date: "2026-02-01",
      },
      {
        slug: "older",
        title: "Older",
        date: "2026-01-01",
      },
    ]);
  });
});
