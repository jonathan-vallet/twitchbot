require("dotenv").config();
const tmi = require("tmi.js");
const fs = require("fs");
const path = require("path");
const ApiServer = require("./apiServer");

const ChannelsModule = require("./modules/ChannelsModule");
const ShoutoutModule = require("./modules/ShoutoutModule");
const ScheduleModule = require("./modules/ScheduleModule");
const VipGameModule = require("./modules/VipGameModule");
const MonsterTrainModule = require("./modules/MonsterTrainModule");
const RankingsModule = require("./modules/RankingsModule");

const { scheduler } = require("timers/promises");

const envPath = path.resolve(__dirname, ".env");

async function validateToken(label, token, prefix = "Bearer") {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `${prefix} ${token}`,
    },
  });

  if (!res.ok) return null;
  return res.json();
}

async function refreshToken(type) {
  const isBot = type === "BOT";
  const refresh = isBot ? process.env.BOT_REFRESH_TOKEN : process.env.REFRESH_TOKEN;
  console.log(`🔄 Refreshing ${type} token...`);
  const res = await fetch(`https://id.twitch.tv/oauth2/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) throw new Error(`Refresh failed for ${type}`);

  const json = await res.json();
  const accessKey = isBot ? "BOT_ACCESS_TOKEN" : "ACCESS_TOKEN";
  const refreshKey = isBot ? "BOT_REFRESH_TOKEN" : "REFRESH_TOKEN";

  updateEnvFile(accessKey, json.access_token);
  updateEnvFile(refreshKey, json.refresh_token);

  console.log(`🔄 ${type} token refreshed.`);

  // Met à jour le process.env pour la suite du script
  process.env[accessKey] = json.access_token;
  process.env[refreshKey] = json.refresh_token;
}

function updateEnvFile(key, value) {
  console.log(`🔄 Updating .env: ${key}=${value}`);
  let envContent = fs.readFileSync(envPath, "utf-8");

  const regex = new RegExp(`^${key}=.*$`, "m");
  if (envContent.match(regex)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, envContent, "utf-8");
}

// 🔄 Validation des deux tokens AVANT toute action
async function ensureTokensValid() {
  const tokenChecks = [
    { type: "BOT", token: process.env.BOT_ACCESS_TOKEN, prefix: "Bearer" },
    { type: "API", token: process.env.ACCESS_TOKEN, prefix: "Bearer" },
  ];

  for (const { type, token, prefix } of tokenChecks) {
    const result = await validateToken(type, token, prefix);
    if (result) {
      console.log(`✅ ${type} token valid for "${result.login}" (expires in ${Math.round(result.expires_in / 60)} mins)`);
      // Schedule a refresh 5 minutes before expiration
      scheduleNextRefresh(type, result);
    } else {
      console.log(`⚠️ ${type} token invalid. Attempting refresh...`);
      try {
        await refreshToken(type);
      } catch (err) {
        console.error(`❌ Failed to refresh ${type} token:`, err.message);
      }
    }
  }
}

async function scheduleNextRefresh(type, result) {
  setTimeout(async () => {
    console.log(`🔄 Refreshing ${type} token...`);
    try {
      await refreshToken(type);
      const refreshed = await validateToken(type, process.env[`${type}_ACCESS_TOKEN`], "Bearer");
      if (refreshed) {
        scheduleNextRefresh(type, refreshed); // planifie la suite avec le nouveau expires_in
      }
    } catch (err) {
      console.error(`❌ Failed to refresh ${type} token:`, err.message);
    }
  }, (result.expires_in - 300) * 1000); // 5 minutes avant l'expiration
}

// === MAIN SCRIPT ===
(async () => {
  await ensureTokensValid();

  const client = new tmi.Client({
    identity: {
      username: process.env.BOT_USERNAME,
      password: "oauth:" + process.env.BOT_ACCESS_TOKEN,
    },
    channels: [process.env.TWITCH_CHANNEL],
  });

  const channel = process.env.TWITCH_CHANNEL.startsWith("#") ? process.env.TWITCH_CHANNEL : `#${process.env.TWITCH_CHANNEL}`;

  const activeModuleList = [
    new ChannelsModule(client, channel),
    new ShoutoutModule(client, channel),
    new ScheduleModule(client, channel),
    new VipGameModule(client, channel),
    new MonsterTrainModule(client, channel),
    new RankingsModule(client, channel),
  ];
  new ApiServer(client, channel);

  client.connect().catch(console.error);

  client.on("connected", (addr, port) => {
    console.log(`[TwitchBot] ✅ Connected to ${addr}:${port} as ${process.env.BOT_USERNAME}`);
    console.log(`[TwitchBot] ✅ Listening on channel ${channel}`);
  });

  client.on("disconnected", (reason) => {
    console.log(`[TwitchBot] ⚠️ Disconnected: ${reason}`);
    client.connect().catch(console.error);
  });

  client.on("message", (channel, tags, message, self) => {
    if (self) return;
    for (const module of activeModuleList) {
      module.onMessage?.(tags, message);
    }
  });
})();
