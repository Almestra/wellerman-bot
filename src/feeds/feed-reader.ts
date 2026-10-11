import Parser from 'rss-parser';

export interface Feed {
  url: string;
  title: string;
}

export type FeedReadResult =
  | { ok: true; feed: Feed }
  | { ok: false; reason: 'invalid-url' | 'unreachable' | 'not-a-feed' };

const parser = new Parser();

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
    const { title } = await parser.parseString(body);
    return {
      ok: true,
      feed: { url: url.href, title: (title ?? '').trim() || url.hostname },
    };
  } catch {
    return { ok: false, reason: 'not-a-feed' };
  }
}
