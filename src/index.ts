import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import type { Interaction } from 'discord.js';

import { commands } from './commands/index.ts';
import { config } from './config.ts';
import { openDatabase } from './database.ts';

openDatabase(config.databasePath);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
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
