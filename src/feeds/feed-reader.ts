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

interface FeedContent {
  feed: Feed;
  articles: Article[];
}

interface CachedFeed {
  etag: string | null;
  lastModified: string | null;
  content: FeedContent;
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

async function parseFeed(
  url: URL,
  body: string,
): Promise<FeedContent | undefined> {
  try {
    const { title, items } = await parser.parseString(body);
    return {
      feed: { url: url.href, title: (title ?? '').trim() || url.hostname },
      articles: items.map(toArticle).filter((article) => article !== undefined),
    };
  } catch {
    return undefined;
  }
}

function revalidationHeaders(
  cached: CachedFeed | undefined,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (cached?.etag) headers['If-None-Match'] = cached.etag;
  if (cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified;
  return headers;
}

export function createFeedReader(fetcher: typeof fetch = fetch): FeedReader {
  const cache = new Map<string, CachedFeed>();

  return async (input) => {
    const url = parseHttpUrl(input);
    if (!url) return { ok: false, reason: 'invalid-url' };

    const cached = cache.get(url.href);
    let response: Response;
    let body: string;
    try {
      response = await fetcher(url, {
        headers: revalidationHeaders(cached),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 304 && cached) {
        return { ok: true, ...cached.content };
      }
      if (!response.ok) return { ok: false, reason: 'unreachable' };
      body = await response.text();
    } catch {
      return { ok: false, reason: 'unreachable' };
    }

    const content = await parseFeed(url, body);
    if (!content) return { ok: false, reason: 'not-a-feed' };

    cache.set(url.href, {
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      content,
    });
    return { ok: true, ...content };
  };
}
