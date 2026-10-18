import type { Client } from 'discord.js';

import { articleEmbed } from './article-embed.ts';
import type { ArticlePublisher } from './publication-service.ts';

export function discordPublisher(client: Client): ArticlePublisher {
  return async ({ channelId, feed, article }) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isSendable()) {
      throw new Error('This channel does not accept messages');
    }
    await channel.send({ embeds: [articleEmbed(feed, article)] });
  };
}
