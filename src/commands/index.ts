import type { Command } from './command.ts';
import { feed } from './feed.ts';
import { ping } from './ping.ts';

const commandList: Command[] = [feed, ping];

export const commands = new Map<string, Command>(
  commandList.map((command) => [command.data.name, command]),
);
