import type { Command } from './command.ts';
import { ping } from './ping.ts';

const commandList: Command[] = [ping];

export const commands = new Map<string, Command>(
  commandList.map((command) => [command.data.name, command]),
);
