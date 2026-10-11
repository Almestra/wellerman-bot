import { describe, expect, it } from 'vitest';

import type { Subscription } from '../subscriptions/subscription-repository.ts';
import { formatSubscriptionList } from './feed-messages.ts';

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 1,
    channelId: '123',
    feedUrl: 'https://example.com/feed.xml',
    feedTitle: 'Harbour News',
    ...overrides,
  };
}

describe('the message listing the subscriptions of a guild', () => {
  it('invites to add a feed when there is no subscription', () => {
    const message = formatSubscriptionList([]);

    expect(message).toContain('/feed add');
  });

  it('shows the channel, the title and the address of a subscription', () => {
    const message = formatSubscriptionList([subscription()]);

    expect(message).toBe(
      '- <#123> · **Harbour News** · <https://example.com/feed.xml>',
    );
  });

  it('sorts the subscriptions by title, ignoring case', () => {
    const message = formatSubscriptionList([
      subscription({ feedTitle: 'Zulu' }),
      subscription({ feedTitle: 'echo' }),
      subscription({ feedTitle: 'Oscar' }),
    ]);

    expect(message).toMatch(/echo.*Oscar.*Zulu/s);
  });

  it('stays within the message limit of Discord and counts the rest', () => {
    const longTitle = 'x'.repeat(900);

    const message = formatSubscriptionList([
      subscription({ feedTitle: `a ${longTitle}` }),
      subscription({ feedTitle: `b ${longTitle}` }),
      subscription({ feedTitle: `c ${longTitle}` }),
    ]);

    expect(message.length).toBeLessThanOrEqual(2000);
    expect(message.split('\n')).toHaveLength(3);
    expect(message).toMatch(/…and 1 more\.$/);
  });
});
