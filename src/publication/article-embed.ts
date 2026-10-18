import { escapeMarkdown } from 'discord.js';
import type { APIEmbed } from 'discord.js';

import type { Article, Feed } from '../feeds/feed-reader.ts';
import { truncate } from '../text.ts';

const authorNameLimit = 256;
const titleLimit = 256;

export function articleEmbed(feed: Feed, article: Article): APIEmbed {
  return {
    author: { name: truncate(feed.title, authorNameLimit) },
    title: truncate(escapeMarkdown(article.title), titleLimit),
    url: article.url,
    timestamp: article.publishedAt?.toISOString(),
  };
}
