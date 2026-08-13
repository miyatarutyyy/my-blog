/*
 * ページの取得や詳細プロパティの読取などの関数はここに
 * ページの表示などは各 page.tsx にて
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * cwd (current working directory)
 * Node.js を実行したときの作業ディレクトリを指す
 */
const postsDirectory = path.join(process.cwd(), "content");

type PostsRepository = {
  getPostSlugs: () => Promise<string[]>;
  getPosts: () => Promise<PostListItem[]>;
  getPost: (slug: string) => Promise<Post | null>;
  getPostSource: (slug: string) => Promise<string | null>;
};

export type PostListItem = {
  slug: string;
  title: string;
  date: string;
};

export type Post = PostListItem & {
  source: string;
};

export const postsRepository = createPostsRepository(postsDirectory);

/**
 * contentディレクトリにある.orgファイルから、
 * URLに使用するslugの一覧を取得する。
 */
export async function getPostSlugs(): Promise<string[]> {
  return postsRepository.getPostSlugs();
}

export async function getPosts(): Promise<PostListItem[]> {
  return postsRepository.getPosts();
}

export async function getPost(slug: string): Promise<Post | null> {
  return postsRepository.getPost(slug);
}

/**
 * slugに対応するOrgファイルを読み込む。
 *
 * 記事が存在しない場合はnullを返す。
 */
export async function getPostSource(slug: string): Promise<string | null> {
  return postsRepository.getPostSource(slug);
}

export function createPostsRepository(baseDirectory: string): PostsRepository {
  async function getPostSlugs() {
    const entries = await readdir(baseDirectory, {
      withFileTypes: true,
    });

    return entries
      .filter((entry) => {
        return entry.isFile() && entry.name.endsWith(".org");
      })
      .map((entry) => {
        return entry.name.replace(/\.org$/, "");
      });
  }

  async function getPostSource(slug: string) {
    // 「../」などを含む不正なslugを拒否する
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return null;
    }

    const filePath = path.join(baseDirectory, `${slug}.org`);

    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  async function getPost(slug: string) {
    const source = await getPostSource(slug);

    if (source == null) {
      return null;
    }

    const title = getOrgKeyword(source, "TITLE");

    if (title == null) {
      throw new Error(`Post "${slug}" is missing required #+TITLE metadata.`);
    }

    const date = getOrgKeyword(source, "DATE");

    if (date == null) {
      throw new Error(`Post "${slug}" is missing required #+DATE metadata.`);
    }

    if (!isValidDateString(date)) {
      throw new Error(
        `Post "${slug}" has invalid #+DATE metadata. Expected YYYY-MM-DD.`
      );
    }

    return {
      slug,
      title,
      date,
      source,
    };
  }

  async function getPosts() {
    const slugs = await getPostSlugs();

    const posts = await Promise.all(
      slugs.map(async (slug) => {
        return getPost(slug);
      })
    );

    return posts
      .filter((post): post is Post => {
        return post != null;
      })
      .map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
      }))
      .sort((a, b) => {
        return b.date.localeCompare(a.date);
      });
  }

  return {
    getPostSlugs,
    getPosts,
    getPost,
    getPostSource,
  };
}

function getOrgKeyword(source: string, keyword: string): string | null {
  const pattern = new RegExp(`^#\\+${keyword}:[ \\t]*(.*)$`, "im");
  const match = source.match(pattern);
  const value = match?.[1]?.trim();

  return value === "" ? null : (value ?? null);
}

function isValidDateString(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match == null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
