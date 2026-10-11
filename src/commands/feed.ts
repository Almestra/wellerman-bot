import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

import type { Command, CommandContext } from './command.ts';
import { describeSubscribeResult } from './feed-messages.ts';

async function add(
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  { subscriptions }: CommandContext,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channelId =
    interaction.options.getChannel('channel')?.id ?? interaction.channelId;
  const result = await subscriptions.subscribe({
    guildId: interaction.guildId,
    channelId,
    url: interaction.options.getString('url', true),
  });

  await interaction.editReply(describeSubscribeResult(result, channelId));
}

export const feed: Command = {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('Manage the feed subscriptions of this server')
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Subscribe a channel to an RSS or Atom feed')
        .addStringOption((option) =>
          option
            .setName('url')
            .setDescription('Address of the feed')
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to post in (defaults to this one)')
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ),
        ),
    ),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      throw new Error('/feed is only available in servers');
    }
    await add(interaction, context);
  },
};
