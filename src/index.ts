import { Client, Events, GatewayIntentBits } from 'discord.js';

import { config } from './config.ts';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

await client.login(config.discordToken);
