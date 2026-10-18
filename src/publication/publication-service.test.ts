import { assert, describe, expect, it } from 'vitest';

import { openDatabase } from '../database.ts';
import { createFeedReader } from '../feeds/feed-reader.ts';
import { SubscriptionRepository } from '../subscriptions/subscription-repository.ts';
import { SubscriptionService } from '../subscriptions/subscription-service.ts';
import { PublicationRepository } from './publication-repository.ts';
import { PublicationService } from './publication-service.ts';
import type { Publication } from './publication-service.ts';

const feedUrl = 'https://example.com/feed.xml';
const otherFeedUrl = 'https://example.org/feed.xml';
const request = { guildId: 'guild', channelId: 'channel', url: feedUrl };
const deletedChannel = 'deleted-channel';

function rss(...items: string[]): string {
  const title = '<title>Harbour News</title>';
  return `<rss version="2.0"><channel>${title}${items.join('')}</channel></rss>`;
}

function item(title: string, date?: string): string {
  const slug = title.toLowerCase().replaceAll(' ', '-');
  return [
    `<item><guid>${slug}</guid><title>${title}</title>`,
    `<link>https://example.com/${slug}</link>`,
    date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : '',
    '</item>',
  ].join('');
}

function createBot() {
  const web = new Map<string, string>();
  const reader = createFeedReader((input) => {
    const body = web.get(new Request(input).url);
    return Promise.resolve(new Response(body, { status: body ? 200 : 404 }));
  });

  const published: Publication[] = [];
  const database = openDatabase(':memory:');
  const subscriptions = new SubscriptionService(
    new SubscriptionRepository(database),
    reader,
  );
  const publication = new PublicationService(
    new PublicationRepository(database),
    reader,
    (sent) => {
      if (sent.channelId === deletedChannel) {
        return Promise.reject(new Error('Unknown Channel'));
      }
      published.push(sent);
      return Promise.resolve();
    },
  );

  return { web, subscriptions, publication, published };
}

function titles(published: Publication[]): string[] {
  return published.map(({ article }) => article.title);
}

function channels(published: Publication[]): string[] {
  return published.map(({ channelId }) => channelId);
}

describe('publishing the new articles of the followed feeds', () => {
  it('publishes an article that appeared since the subscription', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss(item('Low tide')));
    await subscriptions.subscribe(request);
    web.set(
      feedUrl,
      rss(item('High tide', '2026-10-10T06:00:00Z'), item('Low tide')),
    );

    await publication.publishNewArticles();

    expect(published).toEqual([
      {
        channelId: 'channel',
        feed: { url: feedUrl, title: 'Harbour News' },
        article: {
          id: 'high-tide',
          title: 'High tide',
          url: 'https://example.com/high-tide',
          publishedAt: new Date('2026-10-10T06:00:00Z'),
        },
      },
    ]);
  });

  it('publishes an article only once', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    await subscriptions.subscribe(request);
    web.set(feedUrl, rss(item('High tide')));
    await publication.publishNewArticles();

    await publication.publishNewArticles();

    expect(titles(published)).toEqual(['High tide']);
  });

  it('publishes from the oldest article to the most recent', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    await subscriptions.subscribe(request);
    web.set(
      feedUrl,
      rss(
        item('Middle watch', '2026-10-10T00:00:00Z'),
        item('Morning watch', '2026-10-10T04:00:00Z'),
        item('First watch', '2026-10-09T20:00:00Z'),
      ),
    );

    await publication.publishNewArticles();

    expect(titles(published)).toEqual([
      'First watch',
      'Middle watch',
      'Morning watch',
    ]);
  });

  it('publishes a feed without dates from the bottom up', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    await subscriptions.subscribe(request);
    web.set(
      feedUrl,
      rss(item('Morning watch'), item('Middle watch'), item('First watch')),
    );

    await publication.publishNewArticles();

    expect(titles(published)).toEqual([
      'First watch',
      'Middle watch',
      'Morning watch',
    ]);
  });

  it('publishes to every channel that follows the feed', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    await subscriptions.subscribe(request);
    await subscriptions.subscribe({
      guildId: 'other-guild',
      channelId: 'other-channel',
      url: feedUrl,
    });
    web.set(feedUrl, rss(item('High tide')));

    await publication.publishNewArticles();

    expect(channels(published)).toEqual(['channel', 'other-channel']);
  });

  it('keeps publishing to the other channels when one fails', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    await subscriptions.subscribe({ ...request, channelId: deletedChannel });
    await subscriptions.subscribe(request);
    web.set(feedUrl, rss(item('High tide')));

    await publication.publishNewArticles();

    expect(channels(published)).toEqual(['channel']);
  });

  it('keeps publishing the other feeds when one cannot be read', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss());
    web.set(otherFeedUrl, rss());
    await subscriptions.subscribe(request);
    await subscriptions.subscribe({ ...request, url: otherFeedUrl });
    web.delete(feedUrl);
    web.set(otherFeedUrl, rss(item('High tide')));

    await publication.publishNewArticles();

    expect(titles(published)).toEqual(['High tide']);
  });

  it('skips the articles that appeared while nobody followed the feed', async () => {
    const { web, subscriptions, publication, published } = createBot();
    web.set(feedUrl, rss(item('Low tide')));
    await subscriptions.subscribe(request);
    const [subscription] = subscriptions.list('guild');
    assert(subscription);
    subscriptions.unsubscribe('guild', subscription.id);
    web.set(feedUrl, rss(item('High tide'), item('Low tide')));
    await subscriptions.subscribe(request);

    await publication.publishNewArticles();

    expect(published).toEqual([]);
  });
});
