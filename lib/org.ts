import { unified } from "unified";
import parse from 'uniorg-parse';
import uniorgToRehype from 'uniorg-rehype'
import stringify from 'rehype-stringify'

export async function orgToHtml(source: string): Promise<string> {
  const result = await unified()
    .use(parse)
    .use(uniorgToRehype)
    .use(stringify)
    .process(source)

  return String(result)
}
