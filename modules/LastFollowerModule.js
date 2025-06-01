const fs = require("fs");
const path = require("path");
require("dotenv").config();

class LastFollowerModule {
  static getConfig() {
    return {
      updateInterval: 60 * 1000, // toutes les 60s
      outputFile: path.join(__dirname, "..", "overlay", "follow.txt"),
      fallbackText: "—",
    };
  }

  constructor() {
    this.config = this.constructor.getConfig();
    this.broadcasterId = process.env.BROADCASTER_ID;
    this.interval = null;
  }

  start() {
    this.updateFollower();
    this.interval = setInterval(() => this.updateFollower(), this.config.updateInterval);
  }

  async updateFollower() {
    try {
      const res = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${this.broadcasterId}&first=1`, {
        headers: {
          "Client-ID": process.env.CLIENT_ID,
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch followers");
      }

      const data = await res.json();
      const follower = data.data?.[0]?.from_name;

      const text = follower || this.config.fallbackText;
      fs.writeFileSync(this.config.outputFile, text);
      console.log(`[LastFollowerModule] ✅ Updated follower: ${text}`);
    } catch (err) {
      console.error("[LastFollowerModule] ❌ Error fetching follower:", err.message);
      fs.writeFileSync(this.config.outputFile, this.config.fallbackText);
    }
  }
}

module.exports = LastFollowerModule;
