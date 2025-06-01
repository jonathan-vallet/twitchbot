const fs = require("fs");
const path = require("path");

class RankingsModule {
  static rankingsStatsFile = path.join(__dirname, "..", "data", "rankings.json");

  static showRankings(client, channel, showTopOnly = false) {
    if (!fs.existsSync(this.rankingsStatsFile)) {
      client.say(channel, "📭 Aucun classement pour l'instant.");
      return;
    }

    const stats = JSON.parse(fs.readFileSync(this.rankingsStatsFile, "utf-8") || "{}");
    const sorted = Object.entries(stats)
      .map(([name, data]) => ({
        name,
        points: (data.asdor || 0) * 5 + (data.aspic || 0),
      }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points);

    if (sorted.length === 0) {
      client.say(channel, "📭 Aucun point pour le moment.");
      return;
    }

    const rankSymbols = ["🥇", "🥈", "🥉"];
    const list = showTopOnly ? sorted.slice(0, 3) : sorted;

    const ranking = list
      .map((entry, i) => {
        const symbol = rankSymbols[i] || "🏅";
        return `${symbol} ${entry.name} (${entry.points} pts)`;
      })
      .join(" — ");

    client.say(channel, `🏆 Classement actuel : ${ranking}`);
  }

  constructor(client, channel) {
    this.client = client;
    this.channel = channel.startsWith("#") ? channel : `#${channel}`;
    this.lastUsage = 0;
  }

  onMessage(tags, message) {
    const trimmed = message.trim().toLowerCase();
    if (trimmed !== "!classement") return;

    const now = Date.now();
    if (now - this.lastUsage < 10 * 60 * 1000) {
      // 10 minutes de cooldown
      console.log("[RankingsModule] Cooldown actif, pas d'affichage.");
      return;
    }

    console.log("[RankingsModule] Affichage du classement");
    RankingsModule.showRankings(this.client, this.channel);
    this.lastUsage = now;
  }
}

module.exports = RankingsModule;
