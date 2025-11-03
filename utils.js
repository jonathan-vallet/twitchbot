// vipUtils.js
const fs = require("fs");
const path = require("path");

function updateVipStats(username) {
  const rankingStatsFile = path.join(__dirname, "data", "rankings.json");
  console.log("📝 Mise à jour des statistiques du classement VIP...");
  let stats = {};

  if (fs.existsSync(rankingStatsFile)) {
    stats = JSON.parse(fs.readFileSync(rankingStatsFile, "utf-8") || "{}");
  }

  if (!stats[username]) {
    stats[username] = { asdor: 0, aspic: 0 };
  }

  stats[username].asdor += 1;

  fs.writeFileSync(rankingStatsFile, JSON.stringify(stats, null, 2), "utf-8");
  console.log("[VIP Stats] 📝 Stats updated");
}

module.exports = { updateVipStats };
