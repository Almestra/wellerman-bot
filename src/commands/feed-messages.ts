import { channelMention, escapeMarkdown } from 'discord.js';

import type { SubscribeResult } from '../subscriptions/subscription-service.ts';

export function describeSubscribeResult(
  result: SubscribeResult,
  channelId: string,
): string {
  switch (result.status) {
    case 'subscribed':
      return `Subscribed ${channelMention(channelId)} to **${escapeMarkdown(result.feed.title)}**.`;
    case 'already-subscribed':
      return `${channelMention(channelId)} already follows **${escapeMarkdown(result.feed.title)}**.`;
    case 'invalid-url':
      return 'That is not a valid address. It must start with `http://` or `https://`.';
    case 'unreachable':
      return 'I could not reach that address.';
    case 'not-a-feed':
      return 'That page is not an RSS or Atom feed.';
  }
}
