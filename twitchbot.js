require("dotenv").config();
const tmi = require("tmi.js");
const ChannelsModule = require("./modules/ChannelsModule");
const ShoutoutModule = require("./modules/ShoutoutModule");

const client = new tmi.Client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: "oauth:" + process.env.ACCESS_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
});
const channel = process.env.TWITCH_CHANNEL.startsWith("#") ? process.env.TWITCH_CHANNEL : `#${process.env.TWITCH_CHANNEL}`;

// Activate only desired modules here:
const activeModuleList = [new ChannelsModule(client, channel), new ShoutoutModule(client, channel)];

client.connect().catch(console.error);
client.on("connected", (addr, port) => {
  console.log(`[TwitchBot] Connected to ${addr}:${port} as ${process.env.TWITCH_USERNAME}`);
  console.log(`[TwitchBot] Connected to channel ${channel}`);
});

client.on("disconnected", (reason) => {
  console.log(`[TwitchBot] Disconnected : ${reason}`);
  client.connect().catch(console.error);
});

client.on("message", (channel, tags, message, self) => {
  if (self) {
    return;
  }

  for (const module of activeModuleList) {
    module.onMessage?.(tags, message);
  }
});
