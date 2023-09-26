<h1 align="left">Open Bot Backend 🤖</h1>
<p align="left">
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg" />
  </a>
</p>

> Background worker for the Open Dollar protocol

Start using Open Bot in our [Discord](https://discord.opendollar.com)

See recent transactions at https://bot.dev.opendollar.com

## How it works

Open Bot is divided into two parts:

1. `od-bot` [repo](https://github.com/open-dollar/od-bot) - Accepts http requests, sends transactions, and posts updates in Discord
2. `od-bot-slash-commands` [repo](https://github.com/open-dollar/od-bot-slash-commands) - Accepts Discord Slash Commands and forward them to `od-bot`

Not all features can be exposed publicly, therefore a secret is required to call the bot.

## Usage 📖

Start the app:

```bash
yarn dev
```

Hit the endpoint `/api/rate?secret=<some-secret>` to trigger the bot to call `updateRate`.

Available options

- /analytics: Updates the global analytics data used to generate the charts
- /rate: Calls `updateRate`
- /oracle: Calls `updateCollateralPrice` which update the safety price and liquidation price of a collateral type, and `redemptionRate` which updates the redepmtion price.

## Contributing 💡

### Database

Update the `.env`

```
DATABASE_URL=postgres://me:password@0.0.0.0:5432/od-bots-testing
```

Run migrations

```bash
npx prisma migrate dev
```

### Discord

Useful logs are posted in Discord. While this isn't required, it can be very useful for troubleshooting.

1. Update the Discord channel IDs in `manager/lib/discord/alert.js`. This is where logs will be posted.
2. Add the following to the `.env` file. The `ENVIRONMENT` option selects which set of channels to notify.

```
ENVIRONMENT=dev
ENABLE_DISCORD_BOTS=true
DISCORD_BOT_TOKEN=your-token
```

3. Add the bot to your server using the url:

`https://discord.com/api/oauth2/authorize?client_id=<your-client-id>&permissions=0&scope=bot%20applications.commands``

### Going to Production

Migrate your hosted database

```bash
npx prisma deploy
```

Update the cron job secret in `vercel.json` (everyone can see your secret on Github- recommend using a private/separaten repo for cron jobs)

```json
{
  "buildCommand": "yarn prisma generate && yarn prisma migrate deploy && next build",
  "crons": [
    {
      "path": "/api/rate?secret=<your-secret-here>",
      "schedule": "0 */1 * * *"
    }
    //...
  ]
}
```

## Sponsors ❤️

[<img height="65" align="left" src="https://github.com/UseKeyp/.github/blob/main/Keyp-Logo-Color.png?raw=true" alt="keyp-logo">][sponsor-keyp] Improve onboarding and payments in your games & web3 apps effortlessly with OAuth logins for wallets and debit card transactions. [Create a Keyp account; it's free!][sponsor-keyp]<br><br>

## License 📝

Copyright © 2023 Nifty Chess, Inc.<br />
This project is MIT licensed.

[sponsor-keyp]: https://UseKeyp.com
