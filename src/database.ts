import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';

const schema = `
  CREATE TABLE IF NOT EXISTS feeds (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY,
    feed_id INTEGER NOT NULL REFERENCES feeds (id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    UNIQUE (channel_id, feed_id)
  ) STRICT;
`;

export function openDatabase(path: string): Database.Database {
  mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path);
  database.exec(schema);
  return database;
}
