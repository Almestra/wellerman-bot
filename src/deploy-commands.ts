import { REST, Routes } from 'discord.js';

import { commands } from './commands/index.ts';
import { config } from './config.ts';

const body = [...commands.values()].map((command) => command.data.toJSON());

const route = config.discordGuildId
  ? Routes.applicationGuildCommands(
      config.discordClientId,
      config.discordGuildId,
    )
  : Routes.applicationCommands(config.discordClientId);

const rest = new REST().setToken(config.discordToken);
await rest.put(route, { body });

const scope = config.discordGuildId
  ? `guild ${config.discordGuildId}`
  : 'all guilds';
console.log(`Deployed ${String(body.length)} command(s) to ${scope}`);
