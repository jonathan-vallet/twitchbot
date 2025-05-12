require("dotenv").config();
const { fetch } = require("undici");
const fs = require("fs");
const path = require("path");

class ShoutoutModule {
  static getConfig() {
    return {
      commandPrefix: "!so",
      shoutoutEmojiList: ["👀", "🔔", "🌟", "🚀"],
      shoutoutStartTemplateList: [
        "Vous connaissez @{username} ? Foncez le/la suivre !",
        "Allez vite suivre @{username} !",
        "N'hésitez pas à suivre @{username} !",
        "Un petit follow pour @{username} ?",
      ],
      shoutoutChannelEmojiList: ["📺", "🔗", "👉", "🖱️"],
      shoutoutChannelTemplateList: [
        "Retrouvez sa chaîne ici : https://www.twitch.tv/{username}",
        "Son stream est ici : https://www.twitch.tv/{username}",
        "Son live est ici : https://www.twitch.tv/{username}",
        "Son stream est ici : https://www.twitch.tv/{username}",
      ],
      shoutoutEndTemplateList: [
        "🧡 Un petit clic pour vous, un gros coup de pouce pour lui/elle !",
        "🌱 C’est grâce à vous que les petites chaînes grandissent !",
        "🤝 Un follow, c’est un vrai soutien pour les créateur·ices passionné·es !",
        "✨ Il/Elle mérite d’être découvert(e), foncez !",
      ],
      shoutoutCooldown: 60 * 1000, // 30 seconds
    };
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;

    const config = this.constructor.getConfig();
    this.commandPrefix = config.commandPrefix;
    this.shoutoutTemplateList = config.shoutoutTemplateList;
    this.shoutoutCooldown = config.shoutoutCooldown;
    this.previouslyShoutedUser = null; // Store the last shouted user

    this.lastShoutoutTime = 0;

    this.lastIndexMap = {
      shoutoutEmojiList: -1,
      shoutoutStartTemplateList: -1,
      shoutoutChannelEmojiList: -1,
      shoutoutChannelTemplateList: -1,
      shoutoutEndTemplateList: -1,
    };

    this.gameCachePath = path.resolve(__dirname, "../data/lastGames.json");
  }

  async onMessage(tags, message) {
    const trimmed = message.trim();

    if (!trimmed.toLowerCase().startsWith(this.commandPrefix)) {
      return;
    }

    if (!this.isUserAllowedToShoutout(tags)) {
      console.warning("[ShoutoutModule] User not allowed to shoutout");
      return;
    }

    console.log(`[ShoutoutModule] Received message: ${message}`);

    const args = trimmed.split(" ");
    const target = args[1]?.replace("@", "").toLowerCase();

    if (!target || target.length < 2 || target === tags.username.toLowerCase()) {
      console.warning("[ShoutoutModule] Invalid or missing target");
      return;
    }

    const now = Date.now();
    if (now - this.lastShoutoutTime < this.shoutoutCooldown && target === this.previouslyShoutedUser) {
      console.warning("[ShoutoutModule] Cooldown active, shoutout ignored");
      return;
    }

    const streamInfo = await this.fetchStreamInfo(target);
    const game = streamInfo?.gameName || null;

    this.previouslyShoutedUser = target; // Update the last shouted user
    this.lastShoutoutTime = now;

    let shoutoutMessage = this.writeRandomMessage(target, game);
    this.client.say(this.channel, shoutoutMessage);
    console.log(`[ShoutoutModule] Sent shoutout for ${target}`);
  }

  async fetchStreamInfo(username) {
    const url = `https://api.twitch.tv/helix/streams?user_login=${username}`;
    const res = await fetch(url, {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.APP_TOKEN}`,
      },
    });

    if (!res.ok) {
      console.error("[ShoutoutModule] Twitch API error:", res.status);
      const data = await res.json();
      console.error("[ShoutoutModule] Twitch API error details:", data);
      return null;
    }

    const data = await res.json();
    const stream = data.data?.[0];
    return stream ? { gameName: stream.game_name } : null;
  }

  getRandomElement(listName, list) {
    const lastIndex = this.lastIndexMap[listName];
    let index;

    do {
      index = Math.floor(Math.random() * list.length);
    } while (index === lastIndex && list.length > 1);

    this.lastIndexMap[listName] = index;
    return list[index];
  }

  isUserAllowedToShoutout(tags) {
    const isBroadcaster = tags.badges?.broadcaster === "1";
    const isMod = tags.mod === true;

    // Si tu veux que seuls toi et tes mods puissent faire des !so :
    return isBroadcaster || isMod;
  }

  writeRandomMessage(username, game) {
    const shoutoutEmoji = this.getRandomElement("shoutoutEmojiList", this.constructor.getConfig().shoutoutEmojiList);
    const shoutoutStartTemplate = this.getRandomElement("shoutoutStartTemplateList", this.constructor.getConfig().shoutoutStartTemplateList);
    const shoutoutChannelEmoji = this.getRandomElement("shoutoutChannelEmojiList", this.constructor.getConfig().shoutoutChannelEmojiList);
    const shoutoutChannelTemplate = this.getRandomElement("shoutoutChannelTemplateList", this.constructor.getConfig().shoutoutChannelTemplateList);
    const shoutoutEndTemplate = this.getRandomElement("shoutoutEndTemplateList", this.constructor.getConfig().shoutoutEndTemplateList);
    let gameMessage = "";
    const gameCache = this.loadGameCache();
    if (game) {
      gameMessage = `Il/Elle est sur un live ${game} actuellement. `;

      gameCache[username] = {
        lastGame: game,
        lastUpdated: new Date().toISOString(),
      };
      this.saveGameCache(gameCache);
    } else if (gameCache[username]) {
      gameMessage = `Il/Elle était sur ${game} récemment. `;
    }

    return `${shoutoutEmoji} ${shoutoutStartTemplate.replace("{username}", username)} ${gameMessage} ${shoutoutChannelEmoji} ${shoutoutChannelTemplate.replace(
      "{username}",
      username
    )} ${shoutoutEndTemplate}`;
  }

  loadGameCache() {
    try {
      return JSON.parse(fs.readFileSync(this.gameCachePath, "utf-8"));
    } catch {
      return {};
    }
  }

  saveGameCache(cache) {
    fs.writeFileSync(this.gameCachePath, JSON.stringify(cache, null, 2));
  }
}

module.exports = ShoutoutModule;
