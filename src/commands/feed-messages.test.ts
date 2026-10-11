import { describe, expect, it } from 'vitest';

import type { Subscription } from '../subscriptions/subscription-repository.ts';
import {
  formatSubscriptionList,
  suggestSubscriptions,
} from './feed-messages.ts';

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

describe('the subscriptions suggested while typing /feed remove', () => {
  const channelNames = new Map([
    ['10', 'bridge'],
    ['20', 'deck'],
  ]);
  const channelName = (channelId: string): string =>
    channelNames.get(channelId) ?? channelId;
  const subscriptions = [
    subscription({ id: 1, channelId: '20', feedTitle: 'Tide Tables' }),
    subscription({ id: 2, channelId: '10', feedTitle: 'Harbour News' }),
    subscription({ id: 3, channelId: '20', feedTitle: 'Lighthouse Weekly' }),
  ];

  it('suggests every subscription by title when nothing is typed', () => {
    const choices = suggestSubscriptions(subscriptions, '', channelName);

    expect(choices).toEqual([
      { name: '#bridge · Harbour News', value: 2 },
      { name: '#deck · Lighthouse Weekly', value: 3 },
      { name: '#deck · Tide Tables', value: 1 },
    ]);
  });

  it.each([
    { typed: 'LIGHT', part: 'a title', found: '#deck · Lighthouse Weekly' },
    { typed: 'bridge', part: 'a channel', found: '#bridge · Harbour News' },
  ])('keeps what matches part of $part, ignoring case', ({ typed, found }) => {
    const choices = suggestSubscriptions(subscriptions, typed, channelName);

    expect(choices.map(({ name }) => name)).toEqual([found]);
  });

  it('suggests no more than the 25 choices Discord accepts', () => {
    const fleet = Array.from({ length: 30 }, (_, index) =>
      subscription({ id: index, feedTitle: `Ship ${String(index)}` }),
    );

    const choices = suggestSubscriptions(fleet, '', channelName);

    expect(choices).toHaveLength(25);
  });

  it('shortens a name to the 100 characters Discord accepts', () => {
    const longTitle = 'Logbook '.repeat(20);

    const [choice] = suggestSubscriptions(
      [subscription({ feedTitle: longTitle })],
      '',
      channelName,
    );

    expect(choice?.name).toHaveLength(100);
    expect(choice?.name).toMatch(/…$/);
  });
});
