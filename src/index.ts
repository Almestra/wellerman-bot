import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import type { Interaction } from 'discord.js';

import type { CommandContext } from './commands/command.ts';
import { commands } from './commands/index.ts';
import { config } from './config.ts';
import { openDatabase } from './database.ts';
import { readFeed } from './feeds/feed-reader.ts';
import { discordPublisher } from './publication/discord-publisher.ts';
import { PublicationRepository } from './publication/publication-repository.ts';
import { PublicationService } from './publication/publication-service.ts';
import { SubscriptionRepository } from './subscriptions/subscription-repository.ts';
import { SubscriptionService } from './subscriptions/subscription-service.ts';

const database = openDatabase(config.databasePath);
const context: CommandContext = {
  subscriptions: new SubscriptionService(
    new SubscriptionRepository(database),
    readFeed,
  ),
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: [] },
});

const publication = new PublicationService(
  new PublicationRepository(database),
  readFeed,
  discordPublisher(client),
);

function runPublication(): void {
  publication
    .publishNewArticles()
    .catch(console.error)
    .finally(() => setTimeout(runPublication, config.publicationInterval));
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  runPublication();
});

async function handleInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    await command?.autocomplete?.(interaction, context);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, context);
  } catch (error) {
    console.error(error);
    const message = {
      content: 'Something went wrong while running this command.',
      flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  }
}

client.on(Events.InteractionCreate, (interaction) => {
  handleInteraction(interaction).catch(console.error);
});

await client.login(config.discordToken);
