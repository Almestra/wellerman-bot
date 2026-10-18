import { describe, expect, it } from 'vitest';

import type { Article } from '../feeds/feed-reader.ts';
import { articleEmbed } from './article-embed.ts';

const feed = { url: 'https://example.com/feed.xml', title: 'Harbour News' };

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: 'high-tide',
    title: 'High tide',
    url: 'https://example.com/high-tide',
    publishedAt: new Date('2026-10-10T06:00:00Z'),
    ...overrides,
  };
}

describe('the message announcing a new article', () => {
  it('shows the feed, the title, the link and the date of the article', () => {
    const embed = articleEmbed(feed, article());

    expect(embed).toEqual({
      author: { name: 'Harbour News' },
      title: 'High tide',
      url: 'https://example.com/high-tide',
      timestamp: '2026-10-10T06:00:00.000Z',
    });
  });

  it('shows the markdown characters of a title as written', () => {
    const embed = articleEmbed(
      feed,
      article({ title: 'Rigging __init__ with *care*' }),
    );

    expect(embed.title).toBe('Rigging \\_\\_init\\_\\_ with \\*care\\*');
  });

  it('shortens the texts to the 256 characters Discord accepts', () => {
    const embed = articleEmbed(
      { ...feed, title: 'Harbour '.repeat(40) },
      article({ title: '*Logbook* '.repeat(30) }),
    );

    expect(embed.author?.name).toHaveLength(256);
    expect(embed.title).toHaveLength(256);
  });
});
