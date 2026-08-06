/*
 * ページの取得や詳細プロパティの読取などの関数はここに
 * ページの表示などは各 page.tsx にて
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * cwd (current working directory)
 * Node.js を実行したときの作業ディレクトリを指す
 */
const postsDirectory = path.join(process.cwd(), 'content')

export type PostListItem = {
  slug: string
  title: string
  date: string
}

export type Post = PostListItem & {
  source: string
}

/**
 * contentディレクトリにある.orgファイルから、
 * URLに使用するslugの一覧を取得する。
 */
export async function getPostSlugs(): Promise<string[]> {
  const entries = await readdir(postsDirectory, {
    withFileTypes: true,
  })

  return entries
    .filter((entry) => {
      return entry.isFile() && entry.name.endsWith('.org')
    })
    .map((entry) => {
      return entry.name.replace(/\.org$/, '')
    })
}

export async function getPosts(): Promise<PostListItem[]> {
  const slugs = await getPostSlugs()

  const posts = await Promise.all(
    slugs.map(async (slug) => {
      return getPost(slug)
    }),
  )

  return posts
    .filter((post): post is Post => {
      return post != null
    })
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
    }))
    .sort((a, b) => {
      return b.date.localeCompare(a.date)
    })
}

export async function getPost(
  slug: string,
): Promise<Post | null> {
  const source = await getPostSource(slug)

  if (source == null) {
    return null
  }

  return {
    slug,
    title: getOrgKeyword(source, 'TITLE') ?? slug,
    date: getOrgKeyword(source, 'DATE') ?? '',
    source,
  }
}

/**
 * slugに対応するOrgファイルを読み込む。
 *
 * 記事が存在しない場合はnullを返す。
 */
export async function getPostSource(
  slug: string,
): Promise<string | null> {
  // 「../」などを含む不正なslugを拒否する
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return null
  }

  const filePath = path.join(
    postsDirectory,
    `${slug}.org`,
  )

  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

function getOrgKeyword(
  source: string,
  keyword: string,
): string | null {
  const pattern = new RegExp(
    `^#\\+${keyword}:\\s*(.+)$`,
    'im',
  )
  const match = source.match(pattern)

  return match?.[1]?.trim() ?? null
}
