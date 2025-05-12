require("dotenv").config();
const tmi = require("tmi.js");
const ChannelsModule = require("./modules/ChannelsModule");
const ShoutoutModule = require("./modules/ShoutoutModule");
const ScheduleModule = require("./modules/ScheduleModule");

const client = new tmi.Client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: "oauth:" + process.env.ACCESS_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
});
const channel = process.env.TWITCH_CHANNEL.startsWith("#") ? process.env.TWITCH_CHANNEL : `#${process.env.TWITCH_CHANNEL}`;

// Activate only desired modules here:
const activeModuleList = [new ChannelsModule(client, channel), new ShoutoutModule(client, channel), new ScheduleModule(client, channel)];

client.connect().catch(console.error);
client.on("connected", (addr, port) => {
  console.log(`[TwitchBot] Connected to ${addr}:${port} as ${process.env.TWITCH_USERNAME}`);
  console.log(`[TwitchBot] Connected to channel ${channel}`);
});

client.on("disconnected", (reason) => {
  console.log(`[TwitchBot] Disconnected : ${reason}`);
  client.connect().catch(console.error);
  validateAccessToken();
});

client.on("message", (channel, tags, message, self) => {
  if (self) {
    return;
  }

  for (const module of activeModuleList) {
    module.onMessage?.(tags, message);
  }
});

async function validateAccessToken() {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `oauth:${process.env.ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    console.error("Invalid ACCESS_TOKEN: please refresh it manually.");
  }

  const data = await res.json();
  console.log(`✅ Token valid. Logged in as ${data.login} (expires in ${Math.round(data.expires_in / 60)} minutes)`);
}
