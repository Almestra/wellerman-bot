function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: requireEnv('DISCORD_TOKEN'),
  discordClientId: requireEnv('DISCORD_CLIENT_ID'),
  discordGuildId: process.env.DISCORD_GUILD_ID,
  databasePath: 'data/wellerman.db',
};
