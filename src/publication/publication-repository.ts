import type Database from 'better-sqlite3';

import type { Feed } from '../feeds/feed-reader.ts';

const selectFeeds = `
  SELECT url, title FROM feeds
  ORDER BY id
`;

const selectChannels = `
  SELECT subscriptions.channel_id
  FROM subscriptions
  JOIN feeds ON feeds.id = subscriptions.feed_id
  WHERE feeds.url = @feedUrl
  ORDER BY subscriptions.id
`;

const insertSeenArticle = `
  INSERT INTO seen_articles (feed_id, article_id)
  SELECT id, @articleId FROM feeds WHERE url = @feedUrl
  ON CONFLICT DO NOTHING
`;

export class PublicationRepository {
  private readonly database: Database.Database;

  constructor(database: Database.Database) {
    this.database = database;
  }

  listFeeds(): Feed[] {
    return this.database.prepare<[], Feed>(selectFeeds).all();
  }

  listChannels(feedUrl: string): string[] {
    return this.database
      .prepare<{ feedUrl: string }, string>(selectChannels)
      .pluck()
      .all({ feedUrl });
  }

  markSeen(feedUrl: string, articleId: string): boolean {
    const { changes } = this.database
      .prepare(insertSeenArticle)
      .run({ feedUrl, articleId });
    return changes === 1;
  }
}
