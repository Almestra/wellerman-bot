# Wellerman

[![CI](https://github.com/Almestra/wellerman-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Almestra/wellerman-bot/actions/workflows/ci.yml)

> ⚓ Fresh articles on every tide.

Wellerman is a Discord bot that delivers new articles from your RSS and Atom feeds to your channels. Subscribe a channel to the feeds you follow, and the ship returns from every run with whatever was published in the meantime.

## Roadmap

Work in progress: the bot connects to Discord, and the features below are being built in order.

- [x] Project setup: TypeScript, ESLint, Prettier, CI
- [x] Connection to Discord
- [ ] Slash commands
- [ ] Feed subscriptions (`/feed add`, `/feed list`, `/feed remove`)
- [ ] Automatic publication of new articles
- [ ] Categories, keyword filters, OPML import and export
- [ ] Read later and weekly digest

## Tech stack

- **Runtime:** [Node.js](https://nodejs.org/) 24
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Discord library:** [discord.js](https://discord.js.org/)
- **Code quality:** [ESLint](https://eslint.org/) with [typescript-eslint](https://typescript-eslint.io/), and [Prettier](https://prettier.io/)
- **CI:** GitHub Actions

## Getting started

### Prerequisites

- Node.js 24 or later
- A Discord application with a bot token, created in the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/Almestra/wellerman-bot.git
cd wellerman-bot
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your bot token:

```
DISCORD_TOKEN=your-bot-token
```

### Run

```bash
npm run dev
```

## Scripts

| Script           | Description                           |
| ---------------- | ------------------------------------- |
| `npm run dev`    | Run the bot in watch mode             |
| `npm run build`  | Compile TypeScript to `dist/`         |
| `npm start`      | Run the compiled bot                  |
| `npm run check`  | Type-check, lint and check formatting |
| `npm run format` | Format the code with Prettier         |

## License

[MIT](LICENSE)
