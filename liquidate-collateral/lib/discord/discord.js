import fetch from 'node-fetch'

import { logger } from '../logger'

var path = require('path')

const DISCORD_NO_DM_INVOCATION =
  'NOTE: Treasure Chess will never DM you! You can only use the bot in the server.'
const DISCORD_API_URL = 'https://discord.com/api/v9'

class DiscordBot {
  constructor({ clientId, botToken, commands }) {
    if (process.env.VERCEL) return // skip when deployed to Vercel
    const { Client, Intents } = require('discord.js')
    if (!botToken || !clientId || !commands)
      throw 'Invalid Discord params provided'
    try {
      const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES] })
      client.once('ready', async () => {
        logger.debug(`Discord bot ready! ${clientId}`)
      })

      client.on('message', async (message) => {
        if (message.channel.type == 'dm')
          return message.reply(DISCORD_NO_DM_INVOCATION)
      })

      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return
        if (interaction.type == 'dm')
          return interaction.reply(DISCORD_NO_DM_INVOCATION)

        const command = commands.find(
          (cmd) => cmd.data.name === interaction.commandName
        )

        if (!command) return

        try {
          // Extend response deadline from 3s to 15m
          await interaction.deferReply({ ephemeral: false })
          await command.execute(interaction)
        } catch (e) {
          logger.debug('Something went wrong while executing this function')
          logger.debug(e)
          await interaction.editReply({
            content: `Error: ${e}`,
            ephemeral: false,
          })
        }
      })

      logger.debug(`Discord bot starting... ${clientId}`)
      client.login(botToken)
    } catch (e) {
      logger.debug({ custom: e }, 'Bot instantiation error')
      logger.error(e)
      // Maybe we don't want to throw here if there are multiple instances.
    }
  }
}

export const postToChannel = async ({
  message,
  embed,
  channelId,
  botToken,
}) => {
  try {
    await fetchDiscord({
      path: `channels/${channelId}/messages`,
      method: 'POST',
      body: message ? message : JSON.stringify({ embed }),
      botToken,
    })
  } catch (e) {
    Sentry.captureException(e)
  }
}

export const fetchDiscord = async ({
  path: pathArg,
  body,
  method: methodArg,
  botToken,
  accessToken,
}) => {
  try {
    let method = 'GET'
    if (methodArg) method = methodArg
    if (!['POST', 'GET', 'DELETE', 'PUT', 'PATCH'].includes(method))
      throw 'Invalid method'
    if (!path) throw 'No path provided'
    const url = path.join(DISCORD_API_URL, pathArg)
    return await fetch(url, {
      method,
      body,
      headers: {
        ...(botToken && { Authorization: `Bot ${botToken}` }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      // logger.debug({ custom: res }, 'fetchDiscord res')
      if (res.status !== 200) throw res
      return res.json()
    })
  } catch (e) {
    const errorMessage = `fetchDiscord() ${e}`
    /* eslint-disable-next-line no-console */
    console.error(e)
    logger.error(errorMessage)
  }
}

export default DiscordBot
