import { channelMention, escapeMarkdown } from 'discord.js';

import type { Subscription } from '../subscriptions/subscription-repository.ts';
import type { SubscribeResult } from '../subscriptions/subscription-service.ts';

const messageLimit = 2000;

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

function byTitle(a: Subscription, b: Subscription): number {
  return a.feedTitle.localeCompare(b.feedTitle, 'en', { sensitivity: 'base' });
}

function describeSubscription(subscription: Subscription): string {
  const channel = channelMention(subscription.channelId);
  const title = escapeMarkdown(subscription.feedTitle);
  return `- ${channel} · **${title}** · <${subscription.feedUrl}>`;
}

export function formatSubscriptionList(subscriptions: Subscription[]): string {
  if (subscriptions.length === 0) {
    return 'No feed subscriptions yet. Add one with `/feed add`.';
  }

  const lines = subscriptions.toSorted(byTitle).map(describeSubscription);
  let message = lines.join('\n');
  for (let hidden = 1; message.length > messageLimit; hidden += 1) {
    const shown = lines.slice(0, lines.length - hidden);
    message = [...shown, `…and ${String(hidden)} more.`].join('\n');
  }
  return message;
}
