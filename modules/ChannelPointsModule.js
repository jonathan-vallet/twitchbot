const fs = require("fs");
const path = require("path");
require("dotenv").config();

class ChannelPointsPoller {
  static getConfig() {
    return {
      rewardTitle: "l'As d'or", // nom exact
      intervalDelay: 15 * 1000, // 15 secondes
      outputFile: path.join(__dirname, "..", "overlay", "asdor.txt"),
      fallbackText: "—",
    };
  }

  constructor(client, channel) {}

  async start() {
    this.rewardId = await this.getRewardId();

    if (!this.rewardId) {
      console.error("[ChannelPointsPoller] ❌ Reward ID not found, aborting.");
      return;
    }

    this.interval = setInterval(() => this.checkRedemptions(), this.config.intervalDelay);
    this.checkRedemptions(); // Check immediately
    console.log("[ChannelPointsPoller] ✅ Polling started.");
  }

  async getRewardId() {
    const url = `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.BROADCASTER_ID}`;

    const res = await fetch(url, {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}`, // user token avec channel:read:redemptions
      },
    });

    console.log("[ChannelPointsPoller] Fetching rewards...", res);

    if (!res.ok) {
      console.error("[ChannelPointsPoller] ❌ Failed to get rewards:", res.status);
      return null;
    }

    const data = await res.json();
    const reward = data.data.find((r) => r.title === this.config.rewardTitle);
    return reward?.id || null;
  }

  async checkRedemptions() {
    if (this.done) return;

    const url = `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.BROADCASTER_ID}&reward_id=${this.rewardId}&status=UNFULFILLED`;

    const res = await fetch(url, {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}`,
      },
    });

    if (!res.ok) {
      console.error("[ChannelPointsPoller] ❌ Failed to fetch redemptions:", res.status, res);
      return;
    }

    const data = await res.json();
    const redemption = data.data?.[0];

    if (redemption) {
      const username = redemption.user_name;
      this.sendCongrats(username);
      this.writeToFile(username);
      this.stopPolling();
    }
  }

  sendCongrats(username) {
    const msg = `🏆 Félicitations @${username} ! Tu as décroché l’As d’or du stream 🎉`;
    this.client.say(this.channel, msg);
    console.log(`[ChannelPointsPoller] 🎉 As d’or attribué à ${username}`);
  }

  writeToFile(username) {
    try {
      fs.writeFileSync(this.config.outputFile, username || this.config.fallbackText, "utf-8");
    } catch (err) {
      console.error("[ChannelPointsPoller] ❌ Failed to write file:", err.message);
    }
  }

  stopPolling() {
    this.done = true;
    clearInterval(this.interval);
    console.log("[ChannelPointsPoller] ⛔ Polling stopped (reward redeemed)");
  }
}

module.exports = ChannelPointsPoller;
