import { assert, describe, expect, it } from 'vitest';

import { openDatabase } from '../database.ts';
import { readFeed } from '../feeds/feed-reader.ts';
import { SubscriptionRepository } from './subscription-repository.ts';
import { SubscriptionService } from './subscription-service.ts';

const feedUrl = 'https://example.com/feed.xml';
const request = { guildId: 'guild', channelId: 'channel', url: feedUrl };

function rss(title: string): string {
  return `<rss version="2.0"><channel>${title}</channel></rss>`;
}

const harbourNews = rss('<title>Harbour News</title>');

function respondWith(body: string, status = 200): typeof fetch {
  return () => Promise.resolve(new Response(body, { status }));
}

const networkDown: typeof fetch = () =>
  Promise.reject(new TypeError('fetch failed'));

function createService(fetcher: typeof fetch): SubscriptionService {
  const repository = new SubscriptionRepository(openDatabase(':memory:'));
  return new SubscriptionService(repository, (url) => readFeed(url, fetcher));
}

describe('subscribing a channel to a feed', () => {
  it('subscribes the channel under the title of the feed', async () => {
    const service = createService(respondWith(harbourNews));

    const result = await service.subscribe(request);

    expect(result).toEqual({
      status: 'subscribed',
      feed: { url: feedUrl, title: 'Harbour News' },
    });
    expect(service.list('guild')).toMatchObject([
      { channelId: 'channel', feedUrl, feedTitle: 'Harbour News' },
    ]);
  });

  it('names a feed without a title after its host', async () => {
    const service = createService(respondWith(rss('')));

    const result = await service.subscribe(request);

    expect(result).toMatchObject({ feed: { title: 'example.com' } });
  });

  it('reports a channel that already follows the feed', async () => {
    const service = createService(respondWith(harbourNews));
    await service.subscribe(request);

    const result = await service.subscribe(request);

    expect(result.status).toBe('already-subscribed');
    expect(service.list('guild')).toHaveLength(1);
  });

  it('lets several channels follow the same feed', async () => {
    const service = createService(respondWith(harbourNews));
    await service.subscribe(request);

    const result = await service.subscribe({
      ...request,
      channelId: 'other-channel',
    });

    expect(result.status).toBe('subscribed');
    expect(service.list('guild')).toHaveLength(2);
  });

  it.each([
    {
      problem: 'an incomplete address',
      url: 'example.com/feed.xml',
      fetcher: respondWith(harbourNews),
      status: 'invalid-url',
    },
    {
      problem: 'an address that is not an HTTP URL',
      url: 'ftp://example.com/feed.xml',
      fetcher: respondWith(harbourNews),
      status: 'invalid-url',
    },
    {
      problem: 'a site that cannot be reached',
      url: feedUrl,
      fetcher: networkDown,
      status: 'unreachable',
    },
    {
      problem: 'a site that answers with an error',
      url: feedUrl,
      fetcher: respondWith(harbourNews, 404),
      status: 'unreachable',
    },
    {
      problem: 'a page that is not a feed',
      url: feedUrl,
      fetcher: respondWith('<html><body>Hello</body></html>'),
      status: 'not-a-feed',
    },
  ])('refuses $problem', async ({ url, fetcher, status }) => {
    const service = createService(fetcher);

    const result = await service.subscribe({ ...request, url });

    expect(result).toEqual({ status });
    expect(service.list('guild')).toEqual([]);
  });
});

describe('listing the subscriptions of a guild', () => {
  it('leaves out the subscriptions of other guilds', async () => {
    const service = createService(respondWith(harbourNews));
    await service.subscribe(request);
    await service.subscribe({
      guildId: 'other-guild',
      channelId: 'other-channel',
      url: feedUrl,
    });

    const subscriptions = service.list('guild');

    expect(subscriptions).toMatchObject([{ channelId: 'channel' }]);
  });
});

describe('unsubscribing a channel from a feed', () => {
  it('removes the subscription and returns it', async () => {
    const service = createService(respondWith(harbourNews));
    await service.subscribe(request);
    const [subscription] = service.list('guild');
    assert(subscription);

    const removed = service.unsubscribe('guild', subscription.id);

    expect(removed).toEqual(subscription);
    expect(service.list('guild')).toEqual([]);
  });

  it('leaves the subscriptions of other guilds untouched', async () => {
    const service = createService(respondWith(harbourNews));
    await service.subscribe(request);
    const [subscription] = service.list('guild');
    assert(subscription);

    const removed = service.unsubscribe('other-guild', subscription.id);

    expect(removed).toBeUndefined();
    expect(service.list('guild')).toEqual([subscription]);
  });
});
