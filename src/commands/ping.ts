import { SlashCommandBuilder } from 'discord.js';

import type { Command } from './command.ts';

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check that the bot is responding'),
  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};
