import { postToChannel } from "./discord";
import { logger } from "../logger";

const CHANNELS_DEV = {
  action: "1316882856223703090",
  warning: "1316882856223703090",
};
const CHANNELS_PROD = {
  action: "1232919348079890493",
  warning: "1316882856223703090",
};

const botToken = process.env.DISCORD_BOT_TOKEN;

const getChannelId = (channel) => {
  let id = CHANNELS_DEV[channel];
  if (process.env.ENVIRONMENT === "prod") id = CHANNELS_PROD[channel];
  return id;
};

export const sendAlert = async ({ message, embed, channelName, channelId }) => {
  try {
    let id = channelId;
    if (!id) id = getChannelId(channelName);
    await postToChannel({
      message,
      embed,
      channelId: id,
      botToken,
    });
  } catch (e) {
    logger.error(e);
  }
};
