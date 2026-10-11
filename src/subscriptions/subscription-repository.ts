import type Database from 'better-sqlite3';

export interface NewSubscription {
  guildId: string;
  channelId: string;
  feedUrl: string;
  feedTitle: string;
}

export interface Subscription {
  id: number;
  channelId: string;
  feedUrl: string;
  feedTitle: string;
}

const insertFeed = `
  INSERT INTO feeds (url, title)
  VALUES (@feedUrl, @feedTitle)
  ON CONFLICT (url) DO NOTHING
`;

const insertSubscription = `
  INSERT INTO subscriptions (feed_id, guild_id, channel_id)
  SELECT id, @guildId, @channelId FROM feeds WHERE url = @feedUrl
  ON CONFLICT (channel_id, feed_id) DO NOTHING
`;

const selectByGuild = `
  SELECT
    subscriptions.id,
    subscriptions.channel_id AS channelId,
    feeds.url AS feedUrl,
    feeds.title AS feedTitle
  FROM subscriptions
  JOIN feeds ON feeds.id = subscriptions.feed_id
  WHERE subscriptions.guild_id = @guildId
  ORDER BY subscriptions.id
`;

const deleteSubscription = `
  DELETE FROM subscriptions
  WHERE id = @id AND guild_id = @guildId
`;

export class SubscriptionRepository {
  private readonly database: Database.Database;

  constructor(database: Database.Database) {
    this.database = database;
  }

  add(subscription: NewSubscription): boolean {
    const insert = this.database.transaction(() => {
      this.database.prepare(insertFeed).run(subscription);
      const { changes } = this.database
        .prepare(insertSubscription)
        .run(subscription);
      return changes === 1;
    });
    return insert();
  }

  listByGuild(guildId: string): Subscription[] {
    return this.database
      .prepare<{ guildId: string }, Subscription>(selectByGuild)
      .all({ guildId });
  }

  remove(guildId: string, id: number): boolean {
    const { changes } = this.database
      .prepare(deleteSubscription)
      .run({ id, guildId });
    return changes === 1;
  }
}
