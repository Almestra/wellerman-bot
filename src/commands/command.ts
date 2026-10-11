import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

import type { SubscriptionService } from '../subscriptions/subscription-service.ts';

export interface CommandContext {
  subscriptions: SubscriptionService;
}

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    context: CommandContext,
  ) => Promise<void>;
}
