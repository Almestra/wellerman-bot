import Parser from 'rss-parser';

export interface Feed {
  url: string;
  title: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  publishedAt: Date | undefined;
}

export type FeedReadResult =
  | { ok: true; feed: Feed; articles: Article[] }
  | { ok: false; reason: 'invalid-url' | 'unreachable' | 'not-a-feed' };

export type FeedReader = (url: string) => Promise<FeedReadResult>;

interface Item extends Parser.Item {
  id?: string;
}

const parser = new Parser<object, Item>();

function toArticle(item: Item): Article | undefined {
  const url = item.link;
  const id = item.guid ?? item.id ?? url;
  if (!id || !url) return undefined;

  return {
    id,
    title: (item.title ?? '').trim() || url,
    url,
    publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
  };
}

function parseHttpUrl(input: string): URL | undefined {
  if (!URL.canParse(input)) return undefined;
  const url = new URL(input);
  return url.protocol === 'http:' || url.protocol === 'https:'
    ? url
    : undefined;
}

export async function readFeed(
  input: string,
  fetcher: typeof fetch = fetch,
): Promise<FeedReadResult> {
  const url = parseHttpUrl(input);
  if (!url) return { ok: false, reason: 'invalid-url' };

  let body: string;
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, reason: 'unreachable' };
    body = await response.text();
  } catch {
    return { ok: false, reason: 'unreachable' };
  }

  try {
    const { title, items } = await parser.parseString(body);
    return {
      ok: true,
      feed: { url: url.href, title: (title ?? '').trim() || url.hostname },
      articles: items.map(toArticle).filter((article) => article !== undefined),
    };
  } catch {
    return { ok: false, reason: 'not-a-feed' };
  }
}
