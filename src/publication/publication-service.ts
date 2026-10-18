import type { Article, Feed, FeedReader } from '../feeds/feed-reader.ts';
import type { PublicationRepository } from './publication-repository.ts';

export interface Publication {
  channelId: string;
  feed: Feed;
  article: Article;
}

export type ArticlePublisher = (publication: Publication) => Promise<void>;

function oldestFirst(articles: Article[]): Article[] {
  return articles
    .toReversed()
    .toSorted(
      (a, b) =>
        (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0),
    );
}

export class PublicationService {
  private readonly repository: PublicationRepository;
  private readonly readFeed: FeedReader;
  private readonly publish: ArticlePublisher;

  constructor(
    repository: PublicationRepository,
    readFeed: FeedReader,
    publish: ArticlePublisher,
  ) {
    this.repository = repository;
    this.readFeed = readFeed;
    this.publish = publish;
  }

  async publishNewArticles(): Promise<void> {
    for (const feed of this.repository.listFeeds()) {
      const result = await this.readFeed(feed.url);
      if (!result.ok) continue;

      for (const article of oldestFirst(result.articles)) {
        const isNew = this.repository.markSeen(feed.url, article.id);
        if (isNew) await this.publishToFollowers(feed, article);
      }
    }
  }

  private async publishToFollowers(
    feed: Feed,
    article: Article,
  ): Promise<void> {
    for (const channelId of this.repository.listChannels(feed.url)) {
      try {
        await this.publish({ channelId, feed, article });
      } catch (error) {
        console.error(`Could not publish to channel ${channelId}`, error);
      }
    }
  }
}
