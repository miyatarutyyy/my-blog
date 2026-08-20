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

  test("getPostSlugs returns an empty list when there are no Org files", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writeFile(
      path.join(contentDirectory, "draft.txt"),
      "ignored",
      "utf8"
    );

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPostSlugs()).resolves.toEqual([]);
  });

  test("getPostSlugs throws when the content directory cannot be read", async () => {
    const contentDirectory = path.join(
      await createTempContentDirectory(),
      "missing-content"
    );
    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPostSlugs()).rejects.toThrow();
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

  test("getPostSource throws unexpected filesystem errors", async () => {
    const contentDirectory = await createTempContentDirectory();
    await mkdir(path.join(contentDirectory, "unreadable.org"));

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPostSource("unreadable")).rejects.toThrow();
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

  test("getPost throws when required title metadata is missing", async () => {
    const contentDirectory = await createTempContentDirectory();
    const source = "* Body\n";
    await writePost(contentDirectory, "untitled", source);

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("untitled")).rejects.toThrow(
      'Post "untitled" is missing required #+TITLE metadata.'
    );
  });

  test("getPost throws when required title metadata is empty", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(contentDirectory, "empty-title", "#+TITLE:   \n\n* Body\n");

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("empty-title")).rejects.toThrow(
      'Post "empty-title" is missing required #+TITLE metadata.'
    );
  });

  test("getPost throws when required date metadata is missing", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(
      contentDirectory,
      "missing-date",
      "#+TITLE: Missing Date\n\n* Body\n"
    );

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("missing-date")).rejects.toThrow(
      'Post "missing-date" is missing required #+DATE metadata.'
    );
  });

  test("getPost throws when required date metadata is empty", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(
      contentDirectory,
      "empty-date",
      "#+TITLE: Empty Date\n#+DATE:   \n\n* Body\n"
    );

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("empty-date")).rejects.toThrow(
      'Post "empty-date" is missing required #+DATE metadata.'
    );
  });

  test.each(["2026-2-01", "2026-02-30", "2025-02-29", "0000-01-01"])(
    "getPost throws when date metadata is invalid: %s",
    async (date) => {
      const contentDirectory = await createTempContentDirectory();
      await writePost(
        contentDirectory,
        "invalid-date",
        `#+TITLE: Invalid Date\n#+DATE: ${date}\n\n* Body\n`
      );

      const posts = createPostsRepository(contentDirectory);

      await expect(posts.getPost("invalid-date")).rejects.toThrow(
        'Post "invalid-date" has invalid #+DATE metadata. Expected YYYY-MM-DD.'
      );
    }
  );

  test("getPost accepts leap day in a leap year", async () => {
    const contentDirectory = await createTempContentDirectory();
    const source = "#+TITLE: Leap Day\n#+DATE: 2024-02-29\n\n* Body\n";
    await writePost(contentDirectory, "leap-day", source);

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPost("leap-day")).resolves.toEqual({
      slug: "leap-day",
      title: "Leap Day",
      date: "2024-02-29",
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

  test("getPosts throws when an Org file is missing required title metadata", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(contentDirectory, "untitled", "* Body\n");

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPosts()).rejects.toThrow(
      'Post "untitled" is missing required #+TITLE metadata.'
    );
  });

  test("getPosts throws when an Org file is missing required date metadata", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(
      contentDirectory,
      "missing-date",
      "#+TITLE: Missing Date\n\n* Body\n"
    );

    const posts = createPostsRepository(contentDirectory);

    await expect(posts.getPosts()).rejects.toThrow(
      'Post "missing-date" is missing required #+DATE metadata.'
    );
  });

  test("getPosts reports every invalid Org file in a single error", async () => {
    const contentDirectory = await createTempContentDirectory();
    await writePost(contentDirectory, "untitled", "* Body\n");
    await writePost(
      contentDirectory,
      "missing-date",
      "#+TITLE: Missing Date\n\n* Body\n"
    );

    const posts = createPostsRepository(contentDirectory);

    const error = await posts.getPosts().then(
      () => null,
      (reason: unknown) => reason
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Post "untitled" is missing required #+TITLE metadata.'
    );
    expect((error as Error).message).toContain(
      'Post "missing-date" is missing required #+DATE metadata.'
    );
  });
});
