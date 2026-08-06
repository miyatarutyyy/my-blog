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
      const source = await getPostSource(slug)

      if (source == null) {
        return null
      }

      return {
        slug,
        title: getOrgKeyword(source, 'TITLE') ?? slug,
        date: getOrgKeyword(source, 'DATE') ?? '',
      }
    }),
  )

  return posts
    .filter((post): post is PostListItem => {
      return post != null
    })
    .sort((a, b) => {
      return b.date.localeCompare(a.date)
    })
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
