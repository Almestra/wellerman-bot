import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

import type { Command, CommandContext } from './command.ts';
import {
  describeSubscribeResult,
  describeUnsubscribeResult,
  formatSubscriptionList,
  suggestSubscriptions,
} from './feed-messages.ts';

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

async function list(
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  { subscriptions }: CommandContext,
): Promise<void> {
  await interaction.reply({
    content: formatSubscriptionList(subscriptions.list(interaction.guildId)),
    flags: MessageFlags.Ephemeral,
  });
}

async function remove(
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  { subscriptions }: CommandContext,
): Promise<void> {
  const removed = subscriptions.unsubscribe(
    interaction.guildId,
    interaction.options.getInteger('subscription', true),
  );
  await interaction.reply({
    content: describeUnsubscribeResult(removed),
    flags: MessageFlags.Ephemeral,
  });
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List the feed subscriptions of this server'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Unsubscribe a channel from a feed')
        .addIntegerOption((option) =>
          option
            .setName('subscription')
            .setDescription('Subscription to remove')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      throw new Error('/feed is only available in servers');
    }
    switch (interaction.options.getSubcommand()) {
      case 'add':
        await add(interaction, context);
        break;
      case 'list':
        await list(interaction, context);
        break;
      case 'remove':
        await remove(interaction, context);
        break;
    }
  },
  async autocomplete(interaction, { subscriptions }) {
    if (!interaction.inGuild()) return;

    const { guild } = interaction;
    await interaction.respond(
      suggestSubscriptions(
        subscriptions.list(interaction.guildId),
        interaction.options.getFocused(),
        (channelId) => guild?.channels.cache.get(channelId)?.name ?? channelId,
      ),
    );
  },
};
