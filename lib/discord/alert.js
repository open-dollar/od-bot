import { postToChannel } from "./discord";
import { logger } from "../logger";

const CHANNELS_DEV = {
  action: "1139694626828210278",
  warning: "900524323238981703",
};
const CHANNELS_PROD = {
  action: "1154870152844820551",
  warning: "1156322646779248650",
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
