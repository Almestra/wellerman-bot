import type { Feed, FeedReadResult } from '../feeds/feed-reader.ts';
import type {
  Subscription,
  SubscriptionRepository,
} from './subscription-repository.ts';

export type FeedReader = (url: string) => Promise<FeedReadResult>;

export interface SubscribeRequest {
  guildId: string;
  channelId: string;
  url: string;
}

export type SubscribeResult =
  | { status: 'subscribed' | 'already-subscribed'; feed: Feed }
  | { status: 'invalid-url' | 'unreachable' | 'not-a-feed' };

export class SubscriptionService {
  private readonly repository: SubscriptionRepository;
  private readonly readFeed: FeedReader;

  constructor(repository: SubscriptionRepository, readFeed: FeedReader) {
    this.repository = repository;
    this.readFeed = readFeed;
  }

  async subscribe(request: SubscribeRequest): Promise<SubscribeResult> {
    const result = await this.readFeed(request.url);
    if (!result.ok) return { status: result.reason };

    const { feed } = result;
    const added = this.repository.add({
      guildId: request.guildId,
      channelId: request.channelId,
      feedUrl: feed.url,
      feedTitle: feed.title,
    });
    return { status: added ? 'subscribed' : 'already-subscribed', feed };
  }

  list(guildId: string): Subscription[] {
    return this.repository.listByGuild(guildId);
  }

  unsubscribe(guildId: string, id: number): Subscription | undefined {
    const subscription = this.list(guildId).find(
      (candidate) => candidate.id === id,
    );
    if (subscription) this.repository.remove(guildId, id);
    return subscription;
  }
}
